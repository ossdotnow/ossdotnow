import { categoryProjectStatuses, categoryProjectTypes, categoryTags } from '@workspace/db/schema';
import { adminProcedure, createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { account, project, projectClaim, projectTagRelations } from '@workspace/db/schema';
import { and, asc, count, desc, eq, or, ilike, inArray } from 'drizzle-orm';
import { APPROVAL_STATUS, resolveAllIds } from '../utils/project-helpers';
import { projectProviderEnum } from '@workspace/db/schema';
import { PROVIDER_URL_PATTERNS } from '../utils/constants';
import { getActiveDriver } from '../driver/utils';
import { createInsertSchema } from 'drizzle-zod';
import type { createTRPCContext } from '../trpc';
import type { Context } from '../driver/utils';
import { TRPCError } from '@trpc/server';
import { sql } from 'drizzle-orm';
import { z } from 'zod/v4';

const createProjectInput = createInsertSchema(project)
  .omit({
    statusId: true,
    typeId: true,
  })
  .extend({
    status: z.string().min(1, 'Project status is required'),
    type: z.string().min(1, 'Project type is required'),
    tags: z.array(z.string()).default([]),
  });

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
        searchQuery: z.string().optional(),
        statusFilter: z.string().optional(),
        typeFilter: z.string().optional(),
        tagFilter: z.string().optional(),
        providerFilter: z.string().optional(),
        sortBy: z.enum(['recent', 'name', 'stars', 'forks']).optional().default('recent'),
      }),
    )
    .query(async ({ ctx, input }) => {
      const {
        page,
        pageSize,
        approvalStatus,
        searchQuery,
        statusFilter,
        typeFilter,
        tagFilter,
        providerFilter,
        sortBy,
      } = input;
      const offset = (page - 1) * pageSize;

      const conditions = [];

      if (approvalStatus && approvalStatus !== 'all') {
        conditions.push(eq(project.approvalStatus, approvalStatus));
      }

      if (searchQuery) {
        conditions.push(
          or(
            ilike(project.name, `%${searchQuery}%`),
            ilike(project.gitRepoUrl, `%${searchQuery}%`),
          ),
        );
      }

      if (providerFilter && providerFilter !== 'all') {
        conditions.push(
          eq(project.gitHost, providerFilter as (typeof projectProviderEnum.enumValues)[number]),
        );
      }

      const query = ctx.db
        .select({
          project: project,
          status: categoryProjectStatuses,
          type: categoryProjectTypes,
          tagCount: sql<number>`count(distinct ${projectTagRelations.tagId})`.as('tagCount'),
        })
        .from(project)
        .leftJoin(categoryProjectStatuses, eq(project.statusId, categoryProjectStatuses.id))
        .leftJoin(categoryProjectTypes, eq(project.typeId, categoryProjectTypes.id))
        .leftJoin(projectTagRelations, eq(project.id, projectTagRelations.projectId))
        .leftJoin(categoryTags, eq(projectTagRelations.tagId, categoryTags.id))
        .groupBy(project.id, categoryProjectStatuses.id, categoryProjectTypes.id);

      if (statusFilter && statusFilter !== 'all') {
        conditions.push(eq(categoryProjectStatuses.name, statusFilter));
      }

      if (typeFilter && typeFilter !== 'all') {
        conditions.push(eq(categoryProjectTypes.name, typeFilter));
      }

      if (tagFilter && tagFilter !== 'all') {
        conditions.push(eq(categoryTags.name, tagFilter));
      }

      if (conditions.length > 0) {
        query.where(and(...conditions));
      }

      const countQuery = ctx.db
        .select({ totalCount: sql<number>`count(distinct ${project.id})` })
        .from(project)
        .leftJoin(categoryProjectStatuses, eq(project.statusId, categoryProjectStatuses.id))
        .leftJoin(categoryProjectTypes, eq(project.typeId, categoryProjectTypes.id))
        .leftJoin(projectTagRelations, eq(project.id, projectTagRelations.projectId))
        .leftJoin(categoryTags, eq(projectTagRelations.tagId, categoryTags.id));

      if (conditions.length > 0) {
        countQuery.where(and(...conditions));
      }

      const [totalCountResult] = await countQuery;

      const orderByClause = [];

      orderByClause.push(desc(project.isPinned));

      switch (sortBy) {
        case 'name':
          orderByClause.push(asc(project.name));
          break;
        case 'stars':
          // TODO: Add stars count to project data
          // For now, fallback to recent
          orderByClause.push(desc(project.createdAt));
          break;
        case 'forks':
          // TODO: Add forks count to project data
          // For now, fallback to recent
          orderByClause.push(desc(project.createdAt));
          break;
        case 'recent':
        default:
          orderByClause.push(desc(project.createdAt));
          break;
      }

      const projectResults = await query
        .orderBy(...orderByClause)
        .limit(pageSize)
        .offset(offset);

      const projectIds = projectResults.map((r) => r.project.id);
      const tagRelations =
        projectIds.length > 0
          ? await ctx.db.query.projectTagRelations.findMany({
              where: inArray(projectTagRelations.projectId, projectIds),
              with: {
                tag: true,
              },
            })
          : [];

      const tagsByProject = tagRelations.reduce(
        (acc, rel) => {
          if (!acc[rel.projectId]) {
            acc[rel.projectId] = [];
          }
          acc[rel.projectId]?.push(rel);
          return acc;
        },
        {} as Record<string, typeof tagRelations>,
      );

      const projects = projectResults.map((r) => ({
        ...r.project,
        status: r.status,
        type: r.type,
        tagRelations: tagsByProject[r.project.id] || [],
      }));

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
        with: {
          status: true,
          type: true,
          tagRelations: {
            with: {
              tag: true,
            },
          },
        },
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
      with: {
        status: true,
        type: true,
        tagRelations: {
          with: {
            tag: true,
          },
        },
      },
    });
  }),
  addProject: protectedProcedure.input(createProjectInput).mutation(async ({ ctx, input }) => {
    const { statusId, typeId, tagIds } = await resolveAllIds(ctx.db, {
      status: input.status,
      type: input.type,
      tags: input.tags,
    });

    return await ctx.db.transaction(async (tx) => {
      const [newProject] = await tx
        .insert(project)
        .values({
          ...input,
          ownerId: ctx.session.userId,
          statusId,
          typeId,
        })
        .returning();

      if (tagIds.length > 0 && newProject?.id) {
        const tagRelations = tagIds.map((tagId: string) => ({
          projectId: newProject.id as string,
          tagId: tagId as string,
        }));
        await tx.insert(projectTagRelations).values(tagRelations);
      }

      return newProject;
    });
  }),
  updateProject: protectedProcedure.input(createProjectInput).mutation(async ({ ctx, input }) => {
    if (!input.id) throw new Error('Project ID is required for update');
    if (!ctx.session.userId) throw new Error('User not authenticated');
    const projectId = input.id;
    const userId = ctx.session.userId;

    const { statusId, typeId, tagIds } = await resolveAllIds(ctx.db, {
      status: input.status,
      type: input.type,
      tags: input.tags,
    });

    return await ctx.db.transaction(async (tx) => {
      const [updatedProject] = await tx
        .update(project)
        .set({
          ...input,
          statusId,
          typeId,
        })
        .where(and(eq(project.id, projectId), eq(project.ownerId, userId)))
        .returning();

      if (!updatedProject) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found or not owned by you',
        });
      }
      await tx.delete(projectTagRelations).where(eq(projectTagRelations.projectId, projectId));

      if (tagIds.length > 0) {
        const tagRelations = tagIds.map((tagId: string) => ({
          projectId: projectId,
          tagId: tagId as string,
        }));
        await tx.insert(projectTagRelations).values(tagRelations);
      }

      return updatedProject;
    });
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
      const [updatedProject] = await ctx.db
        .update(project)
        .set({ approvalStatus: APPROVAL_STATUS.APPROVED })
        .where(eq(project.id, input.projectId))
        .returning();

      if (!updatedProject) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      return updatedProject;
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
      const [updatedProject] = await ctx.db
        .update(project)
        .set({ approvalStatus: APPROVAL_STATUS.REJECTED })
        .where(eq(project.id, input.projectId))
        .returning();

      if (!updatedProject) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      return updatedProject;
    }),
  pinProject: adminProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [updatedProject] = await ctx.db
        .update(project)
        .set({ isPinned: true })
        .where(eq(project.id, input.projectId))
        .returning();

      if (!updatedProject) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      return updatedProject;
    }),
  unpinProject: adminProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [updatedProject] = await ctx.db
        .update(project)
        .set({ isPinned: false })
        .where(eq(project.id, input.projectId))
        .returning();

      if (!updatedProject) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      return updatedProject;
    }),
  deleteProject: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.userId) throw new Error('User not authenticated');

      const [deletedProject] = await ctx.db
        .update(project)
        .set({ deletedAt: new Date() })
        .where(and(eq(project.id, input.id), eq(project.ownerId, ctx.session.userId)))
        .returning();

      if (!deletedProject) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found or not owned by you',
        });
      }

      return deletedProject;
    }),
  claimProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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

        console.error('API error during claim verification:', error);
        try {
          await ctx.db.insert(projectClaim).values({
            projectId: input.projectId,
            userId: ctx.session.userId!,
            success: false,
            verificationMethod: `${provider}_api_error`,
            verificationDetails: {
              error: error instanceof Error ? error.message : String(error),
              provider,
              repositoryUrl: projectToClaim.gitRepoUrl,
            },
            errorReason: `API error during ${provider} verification: ${error instanceof Error ? error.message : String(error)}`,
          });
        } catch (dbError) {
          console.error('Failed to record claim attempt:', dbError);
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to verify ${provider} ownership. Please try again.`,
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
        } catch (e) {
          result.repoPermission = 'none';
          result.repoPermissionError = e instanceof Error ? e.message : String(e);
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
          } catch (e) {
            result.orgMembership = 'not a member';
            result.orgMembershipError = e instanceof Error ? e.message : String(e);
          }
        }

        return result;
      } catch (error) {
        return { error: error instanceof Error ? error.message : String(error) } as const;
      }
    }),
});
