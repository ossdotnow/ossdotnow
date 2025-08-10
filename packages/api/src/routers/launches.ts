import {
  categoryProjectTypes,
  categoryProjectStatuses,
  categoryTags,
  projectTagRelations,
} from '@workspace/db/schema';
import {
  project,
  projectLaunch,
  projectVote,
  projectComment,
  projectReport,
  user,
} from '@workspace/db/schema';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import { eq, desc, and, sql, gte, lt, lte, inArray } from 'drizzle-orm';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import { TRPCError } from '@trpc/server';
import { z } from 'zod/v4';

async function updateScheduledLaunchesToLive(db: typeof import('@workspace/db').db) {
  const now = new Date();
  await db
    .update(projectLaunch)
    .set({ status: 'live' })
    .where(and(eq(projectLaunch.status, 'scheduled'), lte(projectLaunch.launchDate, now)));
}

export const launchesRouter = createTRPCRouter({
  updateLaunchDescription: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        detailedDescription: z.string().min(25).max(10000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const foundProject = await ctx.db.query.project.findFirst({
        where: eq(project.id, input.projectId),
      });

      if (!foundProject) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      if (foundProject.ownerId !== ctx.session.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only edit your own launches',
        });
      }

      const existingLaunch = await ctx.db.query.projectLaunch.findFirst({
        where: eq(projectLaunch.projectId, input.projectId),
      });

      if (!existingLaunch) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Launch not found for this project',
        });
      }

      if (existingLaunch.status === 'ended') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot edit an ended launch',
        });
      }

      await ctx.db
        .update(projectLaunch)
        .set({ detailedDescription: input.detailedDescription })
        .where(eq(projectLaunch.projectId, input.projectId));

      return { success: true };
    }),

  updateScheduledLaunchDetails: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        tagline: z.string().min(10).max(100),
        detailedDescription: z.string().min(25).max(10000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const foundProject = await ctx.db.query.project.findFirst({
        where: eq(project.id, input.projectId),
      });

      if (!foundProject) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      if (foundProject.ownerId !== ctx.session.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only edit your own launches',
        });
      }

      const existingLaunch = await ctx.db.query.projectLaunch.findFirst({
        where: eq(projectLaunch.projectId, input.projectId),
      });

      if (!existingLaunch) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Launch not found for this project',
        });
      }

      if (existingLaunch.status !== 'scheduled') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only scheduled launches can edit tagline and description',
        });
      }

      await ctx.db
        .update(projectLaunch)
        .set({
          tagline: input.tagline,
          detailedDescription: input.detailedDescription,
        })
        .where(eq(projectLaunch.projectId, input.projectId));

      return { success: true };
    }),
  getLaunchByProjectId: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      await updateScheduledLaunchesToLive(ctx.db);

      const launch = await ctx.db
        .select({
          id: project.id,
          name: project.name,
          tagline: projectLaunch.tagline,
          detailedDescription: projectLaunch.detailedDescription,
          description: project.description,
          logoUrl: project.logoUrl,
          gitRepoUrl: project.gitRepoUrl,
          gitHost: project.gitHost,
          type: categoryProjectTypes.displayName,
          launchDate: projectLaunch.launchDate,
          status: projectLaunch.status,
          featured: projectLaunch.featured,
          owner: {
            id: user.id,
            name: user.name,
            username: user.username,
            image: user.image,
          },
          voteCount: sql<number>`count(distinct ${projectVote.id})::int`.as('voteCount'),
          commentCount: sql<number>`count(distinct ${projectComment.id})::int`.as('commentCount'),
        })
        .from(projectLaunch)
        .innerJoin(project, eq(projectLaunch.projectId, project.id))
        .leftJoin(categoryProjectTypes, eq(project.typeId, categoryProjectTypes.id))
        .leftJoin(user, eq(project.ownerId, user.id))
        .leftJoin(projectVote, eq(projectVote.projectId, project.id))
        .leftJoin(projectComment, eq(projectComment.projectId, project.id))
        .where(eq(project.id, input.projectId))
        .groupBy(
          project.id,
          projectLaunch.id,
          projectLaunch.tagline,
          projectLaunch.detailedDescription,
          projectLaunch.launchDate,
          projectLaunch.status,
          projectLaunch.featured,
          categoryProjectTypes.displayName,
          user.id,
          user.name,
          user.username,
          user.image,
        );

      if (!launch || launch.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Launch not found',
        });
      }

      const launchData = launch[0];
      const tags = await ctx.db
        .select({
          name: categoryTags.name,
          displayName: categoryTags.displayName,
        })
        .from(projectTagRelations)
        .innerJoin(categoryTags, eq(projectTagRelations.tagId, categoryTags.id))
        .where(eq(projectTagRelations.projectId, input.projectId));

      if (ctx.session?.userId) {
        const userVote = await ctx.db.query.projectVote.findFirst({
          where: and(
            eq(projectVote.projectId, input.projectId),
            eq(projectVote.userId, ctx.session.userId),
          ),
        });

        return {
          ...launchData,
          tags: tags.map((tag) => tag.displayName || tag.name),
          hasVoted: !!userVote,
        };
      }

      return {
        ...launchData,
        tags: tags.map((tag) => tag.displayName || tag.name),
        hasVoted: false,
      };
    }),

  getTodayLaunches: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      await updateScheduledLaunchesToLive(ctx.db);

      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);

      const launches = await ctx.db
        .select({
          id: project.id,
          name: project.name,
          tagline: projectLaunch.tagline,
          description: project.description,
          logoUrl: project.logoUrl,
          gitRepoUrl: project.gitRepoUrl,
          gitHost: project.gitHost,
          type: categoryProjectTypes.displayName,
          status: categoryProjectStatuses.displayName,
          launchDate: projectLaunch.launchDate,
          featured: projectLaunch.featured,
          owner: {
            id: user.id,
            name: user.name,
            username: user.username,
            image: user.image,
          },
          voteCount: sql<number>`count(distinct ${projectVote.id})::int`.as('voteCount'),
          commentCount: sql<number>`count(distinct ${projectComment.id})::int`.as('commentCount'),
        })
        .from(projectLaunch)
        .innerJoin(project, eq(projectLaunch.projectId, project.id))
        .leftJoin(categoryProjectStatuses, eq(project.statusId, categoryProjectStatuses.id))
        .leftJoin(categoryProjectTypes, eq(project.typeId, categoryProjectTypes.id))
        .leftJoin(user, eq(project.ownerId, user.id))
        .leftJoin(projectVote, eq(projectVote.projectId, project.id))
        .leftJoin(projectComment, eq(projectComment.projectId, project.id))
        .where(
          and(
            eq(project.approvalStatus, 'approved'),
            eq(project.isRepoPrivate, false),
            eq(projectLaunch.status, 'live'),
            gte(projectLaunch.launchDate, startOfToday),
            lt(projectLaunch.launchDate, endOfToday),
          ),
        )
        .groupBy(
          project.id,
          projectLaunch.id,
          projectLaunch.tagline,
          projectLaunch.launchDate,
          projectLaunch.featured,
          categoryProjectStatuses.displayName,
          categoryProjectTypes.displayName,
          user.id,
          user.name,
          user.username,
          user.image,
        )
        .orderBy(desc(sql`count(distinct ${projectVote.id})`), desc(projectLaunch.launchDate))
        .limit(input.limit)
        .offset(input.offset);

      const launchIds = launches.map((l) => l.id);
      let tagsMap: Record<string, string[]> = {};

      if (launchIds.length > 0) {
        const allTags = await ctx.db
          .select({
            projectId: projectTagRelations.projectId,
            tagName: categoryTags.displayName,
            tagNameFallback: categoryTags.name,
          })
          .from(projectTagRelations)
          .innerJoin(categoryTags, eq(projectTagRelations.tagId, categoryTags.id))
          .where(inArray(projectTagRelations.projectId, launchIds));

        tagsMap = allTags.reduce(
          (acc, tag) => {
            const projectId = tag.projectId;
            if (!acc[projectId]) acc[projectId] = [];
            acc[projectId].push(tag.tagName || tag.tagNameFallback);
            return acc;
          },
          {} as Record<string, string[]>,
        );
      }

      if (ctx.session?.userId) {
        if (launches.length === 0) {
          return [];
        }

        const userVotes = await ctx.db
          .select({
            projectId: projectVote.projectId,
          })
          .from(projectVote)
          .where(
            and(
              eq(projectVote.userId, ctx.session.userId),
              inArray(projectVote.projectId, launchIds),
            ),
          );

        const userVotesSet = new Set(userVotes.map((v) => v.projectId));

        return launches.map((launch) => ({
          ...launch,
          tags: tagsMap[launch.id] || [],
          hasVoted: userVotesSet.has(launch.id),
        }));
      }

      return launches.map((launch) => ({
        ...launch,
        tags: tagsMap[launch.id] || [],
        hasVoted: false,
      }));
    }),

  getYesterdayLaunches: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      await updateScheduledLaunchesToLive(ctx.db);

      const yesterday = subDays(new Date(), 1);
      const startOfYesterday = startOfDay(yesterday);
      const endOfYesterday = endOfDay(yesterday);

      const launches = await ctx.db
        .select({
          id: project.id,
          name: project.name,
          tagline: projectLaunch.tagline,
          description: project.description,
          logoUrl: project.logoUrl,
          gitRepoUrl: project.gitRepoUrl,
          gitHost: project.gitHost,
          type: categoryProjectTypes.displayName,
          status: categoryProjectStatuses.displayName,
          launchDate: projectLaunch.launchDate,
          featured: projectLaunch.featured,
          owner: {
            id: user.id,
            name: user.name,
            username: user.username,
            image: user.image,
          },
          voteCount: sql<number>`count(distinct ${projectVote.id})::int`.as('voteCount'),
          commentCount: sql<number>`count(distinct ${projectComment.id})::int`.as('commentCount'),
        })
        .from(projectLaunch)
        .innerJoin(project, eq(projectLaunch.projectId, project.id))
        .leftJoin(categoryProjectStatuses, eq(project.statusId, categoryProjectStatuses.id))
        .leftJoin(categoryProjectTypes, eq(project.typeId, categoryProjectTypes.id))
        .leftJoin(user, eq(project.ownerId, user.id))
        .leftJoin(projectVote, eq(projectVote.projectId, project.id))
        .leftJoin(projectComment, eq(projectComment.projectId, project.id))
        .where(
          and(
            eq(project.approvalStatus, 'approved'),
            eq(project.isRepoPrivate, false),
            eq(projectLaunch.status, 'live'),
            gte(projectLaunch.launchDate, startOfYesterday),
            lte(projectLaunch.launchDate, endOfYesterday),
          ),
        )
        .groupBy(
          project.id,
          projectLaunch.id,
          projectLaunch.tagline,
          projectLaunch.launchDate,
          projectLaunch.featured,
          categoryProjectStatuses.displayName,
          categoryProjectTypes.displayName,
          user.id,
          user.name,
          user.username,
          user.image,
        )
        .orderBy(desc(sql`count(distinct ${projectVote.id})`), desc(projectLaunch.launchDate))
        .limit(input.limit)
        .offset(input.offset);

      const launchIds = launches.map((l) => l.id);
      let tagsMap: Record<string, string[]> = {};

      if (launchIds.length > 0) {
        const allTags = await ctx.db
          .select({
            projectId: projectTagRelations.projectId,
            tagName: categoryTags.displayName,
            tagNameFallback: categoryTags.name,
          })
          .from(projectTagRelations)
          .innerJoin(categoryTags, eq(projectTagRelations.tagId, categoryTags.id))
          .where(inArray(projectTagRelations.projectId, launchIds));

        tagsMap = allTags.reduce(
          (acc, tag) => {
            const projectId = tag.projectId;
            if (!acc[projectId]) acc[projectId] = [];
            acc[projectId].push(tag.tagName || tag.tagNameFallback);
            return acc;
          },
          {} as Record<string, string[]>,
        );
      }

      if (ctx.session?.userId) {
        if (launches.length === 0) {
          return [];
        }

        const userVotes = await ctx.db
          .select({
            projectId: projectVote.projectId,
          })
          .from(projectVote)
          .where(
            and(
              eq(projectVote.userId, ctx.session.userId),
              inArray(projectVote.projectId, launchIds),
            ),
          );

        const userVotesSet = new Set(userVotes.map((v) => v.projectId));

        return launches.map((launch) => ({
          ...launch,
          tags: tagsMap[launch.id] || [],
          hasVoted: userVotesSet.has(launch.id),
        }));
      }

      return launches.map((launch) => ({
        ...launch,
        tags: tagsMap[launch.id] || [],
        hasVoted: false,
      }));
    }),

  getAllLaunches: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      await updateScheduledLaunchesToLive(ctx.db);
      const launches = await ctx.db
        .select({
          id: project.id,
          name: project.name,
          tagline: projectLaunch.tagline,
          description: project.description,
          logoUrl: project.logoUrl,
          gitRepoUrl: project.gitRepoUrl,
          gitHost: project.gitHost,
          type: categoryProjectTypes.displayName,
          status: categoryProjectStatuses.displayName,
          launchDate: projectLaunch.launchDate,
          featured: projectLaunch.featured,
          owner: {
            id: user.id,
            name: user.name,
            username: user.username,
            image: user.image,
          },
          voteCount: sql<number>`count(distinct ${projectVote.id})::int`.as('voteCount'),
          commentCount: sql<number>`count(distinct ${projectComment.id})::int`.as('commentCount'),
        })
        .from(projectLaunch)
        .innerJoin(project, eq(projectLaunch.projectId, project.id))
        .leftJoin(categoryProjectStatuses, eq(project.statusId, categoryProjectStatuses.id))
        .leftJoin(categoryProjectTypes, eq(project.typeId, categoryProjectTypes.id))
        .leftJoin(user, eq(project.ownerId, user.id))
        .leftJoin(projectVote, eq(projectVote.projectId, project.id))
        .leftJoin(projectComment, eq(projectComment.projectId, project.id))
        .where(
          and(
            eq(project.approvalStatus, 'approved'),
            eq(project.isRepoPrivate, false),
            eq(projectLaunch.status, 'live'),
          ),
        )
        .groupBy(
          project.id,
          projectLaunch.id,
          projectLaunch.tagline,
          projectLaunch.launchDate,
          projectLaunch.featured,
          categoryProjectStatuses.displayName,
          categoryProjectTypes.displayName,
          user.id,
          user.name,
          user.username,
          user.image,
        )
        .orderBy(desc(sql`count(distinct ${projectVote.id})`), desc(projectLaunch.launchDate))
        .limit(input.limit)
        .offset(input.offset);

      const launchIds = launches.map((l) => l.id);
      let tagsMap: Record<string, string[]> = {};

      if (launchIds.length > 0) {
        const allTags = await ctx.db
          .select({
            projectId: projectTagRelations.projectId,
            tagName: categoryTags.displayName,
            tagNameFallback: categoryTags.name,
          })
          .from(projectTagRelations)
          .innerJoin(categoryTags, eq(projectTagRelations.tagId, categoryTags.id))
          .where(inArray(projectTagRelations.projectId, launchIds));

        tagsMap = allTags.reduce(
          (acc, tag) => {
            const projectId = tag.projectId;
            if (!acc[projectId]) acc[projectId] = [];
            acc[projectId].push(tag.tagName || tag.tagNameFallback);
            return acc;
          },
          {} as Record<string, string[]>,
        );
      }

      if (ctx.session?.userId) {
        if (launches.length === 0) {
          return [];
        }

        const userVotes = await ctx.db
          .select({
            projectId: projectVote.projectId,
          })
          .from(projectVote)
          .where(
            and(
              eq(projectVote.userId, ctx.session.userId),
              inArray(projectVote.projectId, launchIds),
            ),
          );

        const userVotesSet = new Set(userVotes.map((v) => v.projectId));

        return launches.map((launch) => ({
          ...launch,
          tags: tagsMap[launch.id] || [],
          hasVoted: userVotesSet.has(launch.id),
        }));
      }

      return launches.map((launch) => ({
        ...launch,
        tags: tagsMap[launch.id] || [],
        hasVoted: false,
      }));
    }),

  getLaunchesByDateRange: publicProcedure
    .input(
      z.object({
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        status: z.enum(['scheduled', 'live', 'ended', 'all']).optional().default('all'),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { startDate, endDate, limit, offset, status } = input;

      // Validate date range
      if (startDate > endDate) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Start date must be before or equal to end date',
        });
      }

      await updateScheduledLaunchesToLive(ctx.db);

      const conditions = [
        eq(project.approvalStatus, 'approved'),
        eq(project.isRepoPrivate, false),
        gte(projectLaunch.launchDate, startDate),
        lte(projectLaunch.launchDate, endDate),
      ];

      // Status filter
      if (status && status !== 'all') {
        conditions.push(eq(projectLaunch.status, status));
      }

      const countQuery = ctx.db
        .select({ totalCount: sql<number>`count(distinct ${projectLaunch.id})` })
        .from(projectLaunch)
        .innerJoin(project, eq(projectLaunch.projectId, project.id))
        .where(and(...conditions));

      const [totalCountResult] = await countQuery;
      const totalCount = totalCountResult?.totalCount ?? 0;

      const launches = await ctx.db
        .select({
          id: project.id,
          name: project.name,
          tagline: projectLaunch.tagline,
          description: project.description,
          logoUrl: project.logoUrl,
          gitRepoUrl: project.gitRepoUrl,
          gitHost: project.gitHost,
          type: categoryProjectTypes.displayName,
          status: categoryProjectStatuses.displayName,
          launchDate: projectLaunch.launchDate,
          launchStatus: projectLaunch.status,
          featured: projectLaunch.featured,
          owner: {
            id: user.id,
            name: user.name,
            username: user.username,
            image: user.image,
          },
          voteCount: sql<number>`count(distinct ${projectVote.id})::int`.as('voteCount'),
          commentCount: sql<number>`count(distinct ${projectComment.id})::int`.as('commentCount'),
        })
        .from(projectLaunch)
        .innerJoin(project, eq(projectLaunch.projectId, project.id))
        .leftJoin(categoryProjectStatuses, eq(project.statusId, categoryProjectStatuses.id))
        .leftJoin(categoryProjectTypes, eq(project.typeId, categoryProjectTypes.id))
        .leftJoin(user, eq(project.ownerId, user.id))
        .leftJoin(projectVote, eq(projectVote.projectId, project.id))
        .leftJoin(projectComment, eq(projectComment.projectId, project.id))
        .where(and(...conditions))
        .groupBy(
          project.id,
          projectLaunch.id,
          projectLaunch.tagline,
          projectLaunch.launchDate,
          projectLaunch.status,
          projectLaunch.featured,
          categoryProjectStatuses.displayName,
          categoryProjectTypes.displayName,
          user.id,
          user.name,
          user.username,
          user.image,
        )
        .orderBy(desc(projectLaunch.launchDate))
        .limit(limit)
        .offset(offset);

      // Get tags for launches
      const launchIds = launches.map((l) => l.id);
      let tagsMap: Record<string, string[]> = {};

      if (launchIds.length > 0) {
        const allTags = await ctx.db
          .select({
            projectId: projectTagRelations.projectId,
            tagName: categoryTags.displayName,
            tagNameFallback: categoryTags.name,
          })
          .from(projectTagRelations)
          .innerJoin(categoryTags, eq(projectTagRelations.tagId, categoryTags.id))
          .where(inArray(projectTagRelations.projectId, launchIds));

        tagsMap = allTags.reduce(
          (acc, tag) => {
            const projectId = tag.projectId;
            if (!acc[projectId]) acc[projectId] = [];
            acc[projectId].push(tag.tagName || tag.tagNameFallback);
            return acc;
          },
          {} as Record<string, string[]>,
        );
      }

      // Handle user votes if authenticated
      if (ctx.session?.userId) {
        if (launches.length === 0) {
          return {
            data: [],
            dateRange: { startDate, endDate },
            totalCount,
          };
        }

        const userVotes = await ctx.db
          .select({
            projectId: projectVote.projectId,
          })
          .from(projectVote)
          .where(
            and(
              eq(projectVote.userId, ctx.session.userId),
              inArray(projectVote.projectId, launchIds),
            ),
          );

        const userVotesSet = new Set(userVotes.map((v) => v.projectId));

        return {
          data: launches.map((launch) => ({
            ...launch,
            tags: tagsMap[launch.id] || [],
            hasVoted: userVotesSet.has(launch.id),
          })),
          dateRange: { startDate, endDate },
          totalCount: totalCount,
        };
      }

      return {
        data: launches.map((launch) => ({
          ...launch,
          tags: tagsMap[launch.id] || [],
          hasVoted: false,
        })),
        dateRange: { startDate, endDate },
        totalCount: totalCount,
      };
    }),

  voteProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existingVote = await ctx.db.query.projectVote.findFirst({
        where: and(
          eq(projectVote.projectId, input.projectId),
          eq(projectVote.userId, ctx.session.userId!),
        ),
      });

      if (existingVote) {
        await ctx.db
          .delete(projectVote)
          .where(
            and(
              eq(projectVote.projectId, input.projectId),
              eq(projectVote.userId, ctx.session.userId!),
            ),
          );
        return { voted: false };
      } else {
        await ctx.db.insert(projectVote).values({
          projectId: input.projectId,
          userId: ctx.session.userId!,
        });
        return { voted: true };
      }
    }),

  reportProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { projectId } = input;
      const existingReport = await ctx.db.query.projectReport.findFirst({
        where: and(
          eq(projectReport.projectId, projectId),
          eq(projectReport.userId, ctx.session.userId!),
        ),
      });

      if (existingReport) {
        await ctx.db
          .delete(projectReport)
          .where(
            and(
              eq(projectReport.projectId, projectId),
              eq(projectReport.userId, ctx.session.userId!),
            ),
          );
        return { reported: false };
      } else {
        await ctx.db.insert(projectReport).values({
          projectId: projectId,
          userId: ctx.session.userId!,
        });
        return { reported: true };
      }
    }),

  addComment: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        content: z.string().min(1).max(1000),
        parentId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [comment] = await ctx.db
        .insert(projectComment)
        .values({
          projectId: input.projectId,
          userId: ctx.session.userId!,
          content: input.content,
          parentId: input.parentId,
        })
        .returning();

      return comment;
    }),

  getComments: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const comments = await ctx.db
        .select({
          id: projectComment.id,
          content: projectComment.content,
          parentId: projectComment.parentId,
          createdAt: projectComment.createdAt,
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            image: user.image,
          },
        })
        .from(projectComment)
        .leftJoin(user, eq(projectComment.userId, user.id))
        .where(eq(projectComment.projectId, input.projectId))
        .orderBy(desc(projectComment.createdAt));

      return comments;
    }),

  launchProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        tagline: z.string().min(10).max(100),
        detailedDescription: z.string().optional(),
        launchDate: z.coerce.date(),
        launchTime: z.string().optional(),
        isScheduled: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const foundProject = await ctx.db.query.project.findFirst({
        where: eq(project.id, input.projectId),
      });

      if (!foundProject) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      if (input.launchTime) {
        const timeRegex = /^([0-9]{1,2}):([0-9]{2})$/;
        const match = input.launchTime.match(timeRegex);

        if (!match) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid time format. Please use HH:MM format (e.g., 14:30 or 9:05)',
          });
        }

        const hours = parseInt(match[1]!, 10);
        const minutes = parseInt(match[2]!, 10);

        if (hours < 0 || hours > 23) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid hour value. Hours must be between 0 and 23',
          });
        }

        if (minutes < 0 || minutes > 59) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid minute value. Minutes must be between 0 and 59',
          });
        }

        const launchDate = new Date(input.launchDate);
        launchDate.setHours(hours, minutes, 0, 0);
        input.launchDate = launchDate;
      }

      if (input.isScheduled && input.launchDate.getTime() < Date.now()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Launch date cannot be in the past',
        });
      }

      if (foundProject.ownerId !== ctx.session.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only launch your own projects',
        });
      }

      if (foundProject.isRepoPrivate) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message:
            'You cannot launch a project with a private repository. Please make your repository public first.',
        });
      }

      const existingLaunch = await ctx.db.query.projectLaunch.findFirst({
        where: eq(projectLaunch.projectId, input.projectId),
      });

      if (existingLaunch) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'This project has already been launched',
        });
      }

      let status: 'live' | 'scheduled';
      let finalLaunchDate = input.launchDate;

      if (input.isScheduled) {
        const now = new Date();
        status = input.launchDate.getTime() <= now.getTime() ? 'live' : 'scheduled';
      } else {
        finalLaunchDate = new Date();
        status = 'live';
      }

      const [launch] = await ctx.db
        .insert(projectLaunch)
        .values({
          projectId: input.projectId,
          tagline: input.tagline,
          detailedDescription: input.detailedDescription,
          launchDate: finalLaunchDate,
          status: status,
        })
        .returning();

      return launch;
    }),

  getUserScheduledLaunches: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session.userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    await updateScheduledLaunchesToLive(ctx.db);

    const launches = await ctx.db
      .select({
        id: project.id,
        name: project.name,
        tagline: projectLaunch.tagline,
        description: project.description,
        logoUrl: project.logoUrl,
        launchDate: projectLaunch.launchDate,
        createdAt: projectLaunch.createdAt,
      })
      .from(projectLaunch)
      .innerJoin(project, eq(projectLaunch.projectId, project.id))
      .where(and(eq(project.ownerId, ctx.session.userId), eq(projectLaunch.status, 'scheduled')))
      .orderBy(projectLaunch.launchDate);

    return launches;
  }),

  removeLaunch: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }
      const foundProject = await ctx.db.query.project.findFirst({
        where: eq(project.id, input.projectId),
      });

      if (!foundProject) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      if (foundProject.ownerId !== ctx.session.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only remove launches for your own projects',
        });
      }
      const existingLaunch = await ctx.db.query.projectLaunch.findFirst({
        where: eq(projectLaunch.projectId, input.projectId),
      });

      if (!existingLaunch) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Launch not found for this project',
        });
      }
      await ctx.db.transaction(async (tx) => {
        await tx.delete(projectVote).where(eq(projectVote.projectId, input.projectId));
        await tx.delete(projectComment).where(eq(projectComment.projectId, input.projectId));
        await tx.delete(projectReport).where(eq(projectReport.projectId, input.projectId));
        await tx.delete(projectLaunch).where(eq(projectLaunch.projectId, input.projectId));
      });

      return { success: true, message: 'Launch removed successfully' };
    }),
});
