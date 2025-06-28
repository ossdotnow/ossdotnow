import { adminProcedure, createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { account, project, projectProviderEnum } from '@workspace/db/schema';
import { PROVIDER_URL_PATTERNS } from '../utils/constants';
import { getActiveDriver } from '../driver/utils';
import { and, asc, count, desc, eq } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import type { createTRPCContext } from '../trpc';
import type { Context } from '../driver/utils';
import { TRPCError } from '@trpc/server';
import { z } from 'zod/v4';

const createProjectInput = createInsertSchema(project);

type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

interface VerifyGitHubOwnershipContext {
  db: TRPCContext['db'];
  session: {
    userId: string;
  };
}

export interface DebugPermissionsResult {
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

export const projectsRouter = createTRPCRouter({
  getProjects: publicProcedure
    .input(
      z.object({
        approvalStatus: z.enum(['approved', 'rejected', 'pending', 'all']).optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, approvalStatus } = input;
      const offset = (page - 1) * pageSize;

      // Build where clause based on approval status
      const whereClause =
        approvalStatus === 'all' || !approvalStatus
          ? undefined
          : eq(project.approvalStatus, approvalStatus);

      // Get total count
      const [totalCountResult] = await ctx.db
        .select({ totalCount: count() })
        .from(project)
        .where(whereClause)
        .limit(1);

      // Get paginated results
      const projects = await ctx.db.query.project.findMany({
        where: whereClause,
        orderBy: [desc(project.isPinned), asc(project.name)],
        limit: pageSize,
        offset,
      });

      const totalCount = totalCountResult?.totalCount ?? 0;

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / pageSize);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        data: projects,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages,
          hasNextPage,
          hasPreviousPage,
        },
      };
    }),
  getProjectsByUserId: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, userId } = input;
      const offset = (page - 1) * pageSize;

      const whereClause = eq(project.ownerId, userId);

      const [totalCountResult] = await ctx.db
        .select({ totalCount: count() })
        .from(project)
        .where(whereClause)
        .limit(1);

      const projects = await ctx.db.query.project.findMany({
        where: whereClause,
        orderBy: [asc(project.name)],
        limit: pageSize,
        offset,
      });

      const totalCount = totalCountResult?.totalCount ?? 0;

      const totalPages = Math.ceil(totalCount / pageSize);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        data: projects,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages,
          hasNextPage,
          hasPreviousPage,
        },
      };
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
  acceptProject: adminProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Add audit trail logging
      // Example: await logAdminAction({
      //   action: 'project_approved',
      //   projectId: input.projectId,
      //   adminId: ctx.user.id,
      //   timestamp: new Date()
      // });
      return ctx.db
        .update(project)
        .set({ approvalStatus: 'approved' })
        .where(eq(project.id, input.projectId))
        .returning();
    }),
  rejectProject: adminProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Add audit trail logging
      // Example: await logAdminAction({
      //   action: 'project_rejected',
      //   projectId: input.projectId,
      //   adminId: ctx.user.id,a
      //   timestamp: new Date()
      // });
      return ctx.db
        .update(project)
        .set({ approvalStatus: 'rejected' })
        .where(eq(project.id, input.projectId))
        .returning();
    }),
  pinProject: adminProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db
        .update(project)
        .set({ isPinned: true })
        .where(eq(project.id, input.projectId))
        .returning();
    }),
  unpinProject: adminProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db
        .update(project)
        .set({ isPinned: false })
        .where(eq(project.id, input.projectId))
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
          message: 'This project does not have a repository URL',
        });
      }

      const provider = projectToClaim.gitHost as (typeof projectProviderEnum.enumValues)[number];

      const driver = await getActiveDriver(provider, ctx as Context);

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
        .where(and(eq(account.userId, userId), eq(account.providerId, provider)))
        .limit(1);

      if (!userAccount[0]?.accessToken) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: `Please connect your ${provider} account to claim this project`,
        });
      }

      const match = projectToClaim.gitRepoUrl.match(PROVIDER_URL_PATTERNS[provider]);
      if (!match) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Invalid ${provider} repository URL format`,
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

        const result = await driver.verifyOwnership(
          `${owner}/${repo}`,
          verifyContext,
          input.projectId,
        );
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

      const provider = projectToCheck.gitHost as (typeof projectProviderEnum.enumValues)[number];

      if (projectToCheck.ownerId) {
        return { canClaim: false, reason: 'Project already claimed' };
      }

      if (!projectToCheck.gitRepoUrl) {
        return { canClaim: false, reason: `No ${provider} repository URL` };
      }

      const userId = ctx.session.userId;
      if (!userId) {
        return { canClaim: false, reason: 'Not logged in' };
      }

      const userAccount = await ctx.db
        .select({ accessToken: account.accessToken })
        .from(account)
        .where(and(eq(account.userId, userId), eq(account.providerId, provider)))
        .limit(1);

      if (!userAccount[0]?.accessToken) {
        return {
          canClaim: false,
          reason: `${provider} account not connected`,
          needsAuth: true,
        };
      }

      return {
        canClaim: true,
        projectName: projectToCheck.name,
        gitRepoUrl: projectToCheck.gitRepoUrl,
      };
    }),
  debugRepositoryPermissions: protectedProcedure
    .input(z.object({ repoUrl: z.string(), projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.userId;
      if (!userId) {
        return { error: 'Not logged in' };
      }

      const projectToCheck = await ctx.db.query.project.findFirst({
        where: eq(project.id, input.projectId),
      });

      if (!projectToCheck) {
        return { error: 'Project not found' };
      }

      const provider = projectToCheck.gitHost as (typeof projectProviderEnum.enumValues)[number];

      const userAccount = await ctx.db
        .select({ accessToken: account.accessToken })
        .from(account)
        .where(and(eq(account.userId, userId), eq(account.providerId, provider)))
        .limit(1);

      if (!userAccount[0]?.accessToken) {
        return { error: `${provider} account not connected` };
      }

      const match = input.repoUrl.match(PROVIDER_URL_PATTERNS[provider]);
      if (!match) {
        return { error: `Invalid ${provider} repository URL format` };
      }
      const [, owner, repo] = match;

      const driver = await getActiveDriver(provider, ctx as Context);

      if (!owner || !repo) {
        return { error: 'Invalid repository format' };
      }

      try {
        const currentUser = await driver.getCurrentUser();
        const repoData = await driver.getRepo(`${owner}/${repo}`);

        const result: DebugPermissionsResult = {
          currentUser: currentUser.username,
          repoOwner: repoData.owner.login,
          repoOwnerType: repoData.owner.type,
          isDirectOwner: repoData.owner.login === currentUser.username,
        };

        try {
          const repoPermissions = await driver.getRepoPermissions(`${owner}/${repo}`);

          result.repoPermission = repoPermissions.permission;
          result.repoPermissionDetails = repoPermissions;
        } catch (e: unknown) {
          result.repoPermission = 'none';
          result.repoPermissionError = (e as Error).message;
        }

        if (repoData.owner.type === 'Organization') {
          try {
            const membership = await driver.getOrgMembership(
              repoData.owner.login,
              currentUser.username,
            );
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
