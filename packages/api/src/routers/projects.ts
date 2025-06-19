import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { Api } from '@octokit/plugin-rest-endpoint-methods';
import { account, project } from '@workspace/db/schema';
import { createInsertSchema } from 'drizzle-zod';
import { createOctokitInstance } from './github';
import type { createTRPCContext } from '../trpc';
import { TRPCError } from '@trpc/server';
import { Octokit } from '@octokit/core';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod/v4';

const createProjectInput = createInsertSchema(project);

type Project = typeof project.$inferSelect;
type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

interface VerifyGitHubOwnershipContext {
  db: TRPCContext['db'];
  session: {
    userId: string;
  };
}

interface DebugPermissionsResult {
  currentUser: string;
  repoOwner: string;
  repoOwnerType: string;
  isDirectOwner: boolean;
  repoPermission?: string;
  repoPermissionDetails?: {
    permission: string;
    user?: Record<string, unknown> | null;
    [key: string]: unknown;
  };
  repoPermissionError?: string;
  orgMembership?:
    | {
        role: string;
        state: string;
      }
    | string;
  orgMembershipError?: string;
}

async function verifyGitHubOwnership(
  github: Octokit & Api,
  owner: string,
  repo: string,
  ctx: VerifyGitHubOwnershipContext,
  input: { projectId: string },
): Promise<{ success: boolean; project: Project; ownershipType: string; verifiedAs: string }> {
  const { data: currentUser } = await github.rest.users.getAuthenticated();

  const { data: repoData } = await github.rest.repos.get({
    owner,
    repo,
  });

  let isOwner = false;
  let ownershipType = '';

  if (repoData.owner.login === currentUser.login) {
    isOwner = true;
    ownershipType = 'repository owner';
  } else if (repoData.owner.type === 'Organization') {
    console.log(`Checking org ownership for ${currentUser.login} in org ${repoData.owner.login}`);

    try {
      const { data: repoPermissions } = await github.rest.repos.getCollaboratorPermissionLevel({
        owner,
        repo,
        username: currentUser.login,
      });

      console.log(
        `User ${currentUser.login} has ${repoPermissions.permission} permission on the repository`,
      );

      if (repoPermissions.permission === 'admin') {
        try {
          const { data: membership } = await github.rest.orgs.getMembershipForUser({
            org: repoData.owner.login,
            username: currentUser.login,
          });

          console.log(
            `User ${currentUser.login} has role '${membership.role}' in org with state '${membership.state}'`,
          );

          if (membership.role === 'admin' && membership.state === 'active') {
            isOwner = true;
            ownershipType = 'organization owner';
          }
        } catch (orgError) {
          console.log('Error checking org membership:', orgError);
          isOwner = true;
          ownershipType = 'repository admin';
        }
      }
    } catch (error: unknown) {
      console.log(
        'User does not have collaborator access to the repository:',
        (error as Error).message,
      );

      try {
        const { data: membership } = await github.rest.orgs.getMembershipForUser({
          org: repoData.owner.login,
          username: currentUser.login,
        });

        if (membership.role === 'admin' && membership.state === 'active') {
          isOwner = true;
          ownershipType = 'organization owner';
        }
      } catch (orgError) {
        console.log('User is not a member of the organization');
      }
    }
  }

  if (!isOwner) {
    console.log(`Claim denied for user ${currentUser.login} on repo ${owner}/${repo}`);
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `You don't have the required permissions to claim this project. You must be either the repository owner or an organization owner. Current user: ${currentUser.login}, Repository owner: ${repoData.owner.login}`,
    });
  }

  console.log(`Claim approved: ${currentUser.login} is ${ownershipType} for ${owner}/${repo}`);

  const updatedProject = await ctx.db
    .update(project)
    .set({
      ownerId: ctx.session.userId,
      updatedAt: new Date(),
    })
    .where(eq(project.id, input.projectId))
    .returning();

  if (!updatedProject[0]) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update project ownership',
    });
  }

  // Create a notification or send an email to inform about the claim
  // This would require implementing a notification system
  // Example: await createNotification({
  //   type: 'project_claimed',
  //   projectId: input.projectId,
  //   newOwnerId: ctx.session.userId,
  // });

  return {
    success: true,
    project: updatedProject[0],
    ownershipType,
    verifiedAs: currentUser.login,
  };
}

export const projectsRouter = createTRPCRouter({
  getProjects: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.project.findMany();
  }),
  getProject: publicProcedure.input(z.object({ id: z.string() })).query(({ ctx, input }) => {
    return ctx.db.query.project.findFirst({
      where: eq(project.id, input.id),
    });
  }),
  addProject: protectedProcedure.input(createProjectInput).mutation(async ({ ctx, input }) => {
    return ctx.db
      .insert(project)
      .values({
        ...input,
        ownerId: ctx.session.userId,
      })
      .returning();
  }),
  updateProject: protectedProcedure.input(createProjectInput).mutation(async ({ ctx, input }) => {
    if (!input.id) throw new Error('Project ID is required for update');
    if (!ctx.session.userId) throw new Error('User not authenticated');

    return ctx.db
      .update(project)
      .set(input)
      .where(and(eq(project.id, input.id), eq(project.ownerId, ctx.session.userId)))
      .returning();
  }),
  deleteProject: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.userId) throw new Error('User not authenticated');

      return ctx.db
        .update(project)
        .set({ deletedAt: new Date() })
        .where(and(eq(project.id, input.id), eq(project.ownerId, ctx.session.userId)))
        .returning();
    }),
  claimProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const github = await createOctokitInstance(ctx);

      // 1. Get the project details
      const projectToClaim = await ctx.db.query.project.findFirst({
        where: eq(project.id, input.projectId),
      });

      if (!projectToClaim) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      if (projectToClaim.ownerId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This project has already been claimed',
        });
      }

      if (!projectToClaim.gitRepoUrl) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This project does not have a GitHub repository URL',
        });
      }

      const userId = ctx.session.userId;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to claim a project',
        });
      }

      const userAccount = await ctx.db
        .select({ accessToken: account.accessToken })
        .from(account)
        .where(and(eq(account.userId, userId), eq(account.providerId, 'github')))
        .limit(1);

      if (!userAccount[0]?.accessToken) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Please connect your GitHub account to claim this project',
        });
      }

      const githubUrlRegex = /(?:https?:\/\/github\.com\/|^)([^\/]+)\/([^\/]+?)(?:\.git|\/|$)/;
      const match = projectToClaim.gitRepoUrl.match(githubUrlRegex);
      if (!match) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid GitHub repository URL format',
        });
      }

      const [, owner, repo] = match;

      if (!owner || !repo || !ctx) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Could not extract owner and repository name from URL',
        });
      }

      try {
        if (!ctx.session?.userId) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Session not found or invalid',
          });
        }

        const verifyContext: VerifyGitHubOwnershipContext = {
          db: ctx.db,
          session: { userId: ctx.session.userId },
        };

        const result = await verifyGitHubOwnership(github, owner, repo, verifyContext, input);
        return result;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error('GitHub API error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to verify GitHub ownership. Please try again.',
        });
      }
    }),
  canClaimProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const projectToCheck = await ctx.db.query.project.findFirst({
        where: eq(project.id, input.projectId),
      });

      if (!projectToCheck) {
        return { canClaim: false, reason: 'Project not found' };
      }

      if (projectToCheck.ownerId) {
        return { canClaim: false, reason: 'Project already claimed' };
      }

      if (!projectToCheck.gitRepoUrl) {
        return { canClaim: false, reason: 'No GitHub repository URL' };
      }

      const userId = ctx.session.userId;
      if (!userId) {
        return { canClaim: false, reason: 'Not logged in' };
      }

      const userAccount = await ctx.db
        .select({ accessToken: account.accessToken })
        .from(account)
        .where(and(eq(account.userId, userId), eq(account.providerId, 'github')))
        .limit(1);

      if (!userAccount[0]?.accessToken) {
        return {
          canClaim: false,
          reason: 'GitHub account not connected',
          needsGitHubAuth: true,
        };
      }

      return {
        canClaim: true,
        projectName: projectToCheck.name,
        gitRepoUrl: projectToCheck.gitRepoUrl,
      };
    }),

  debugGitHubPermissions: protectedProcedure
    .input(z.object({ repoUrl: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.userId;
      if (!userId) {
        return { error: 'Not logged in' };
      }

      const userAccount = await ctx.db
        .select({ accessToken: account.accessToken })
        .from(account)
        .where(and(eq(account.userId, userId), eq(account.providerId, 'github')))
        .limit(1);

      if (!userAccount[0]?.accessToken) {
        return { error: 'GitHub account not connected' };
      }

      const githubUrlRegex = /(?:https?:\/\/github\.com\/|^)([^\/]+)\/([^\/]+?)(?:\.git|\/|$)/;
      const match = input.repoUrl.match(githubUrlRegex);
      if (!match) {
        return { error: 'Invalid GitHub repository URL format' };
      }
      const [, owner, repo] = match;

      const github = await createOctokitInstance(ctx);

      if (!owner || !repo) {
        return { error: 'Invalid repository format' };
      }

      try {
        const { data: currentUser } = await github.rest.users.getAuthenticated();
        const { data: repoData } = await github.rest.repos.get({
          owner,
          repo,
        });

        const result: DebugPermissionsResult = {
          currentUser: currentUser.login,
          repoOwner: repoData.owner.login,
          repoOwnerType: repoData.owner.type,
          isDirectOwner: repoData.owner.login === currentUser.login,
        };

        try {
          const { data: repoPermissions } = await github.rest.repos.getCollaboratorPermissionLevel({
            owner,
            repo,
            username: currentUser.login,
          });
          result.repoPermission = repoPermissions.permission;
          result.repoPermissionDetails = repoPermissions;
        } catch (e: unknown) {
          result.repoPermission = 'none';
          result.repoPermissionError = (e as Error).message;
        }

        if (repoData.owner.type === 'Organization') {
          try {
            const { data: membership } = await github.rest.orgs.getMembershipForUser({
              org: repoData.owner.login,
              username: currentUser.login,
            });
            result.orgMembership = {
              role: membership.role,
              state: membership.state,
            };
          } catch (e: unknown) {
            result.orgMembership = 'not a member';
            result.orgMembershipError = (e as Error).message;
          }
        }

        return result;
      } catch (error: unknown) {
        return { error: (error as Error).message };
      }
    }),
});
