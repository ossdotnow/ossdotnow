import { project, projectLaunch, projectVote, projectComment, user } from '@workspace/db/schema';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import { eq, desc, and, sql, gte, lt } from 'drizzle-orm';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import { TRPCError } from '@trpc/server';
import { z } from 'zod/v4';

export const launchesRouter = createTRPCRouter({
  getLaunchByProjectId: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const launch = await ctx.db
        .select({
          id: project.id,
          name: project.name,
          tagline: projectLaunch.tagline,
          detailedDescription: projectLaunch.detailedDescription,
          description: project.description,
          logoUrl: project.logoUrl,
          gitRepoUrl: project.gitRepoUrl,
          type: project.type,
          tags: project.tags,
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
          projectLaunch.featured,
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

      if (ctx.session?.userId) {
        const userVote = await ctx.db.query.projectVote.findFirst({
          where: and(
            eq(projectVote.projectId, input.projectId),
            eq(projectVote.userId, ctx.session.userId),
          ),
        });

        return {
          ...launchData,
          hasVoted: !!userVote,
        };
      }

      return {
        ...launchData,
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
          type: project.type,
          tags: project.tags,
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
        .leftJoin(user, eq(project.ownerId, user.id))
        .leftJoin(projectVote, eq(projectVote.projectId, project.id))
        .leftJoin(projectComment, eq(projectComment.projectId, project.id))
        .where(
          and(
            eq(project.approvalStatus, 'approved'),
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
          user.id,
          user.name,
          user.username,
          user.image,
        )
        .orderBy(desc(sql`count(distinct ${projectVote.id})`), desc(projectLaunch.launchDate))
        .limit(input.limit)
        .offset(input.offset);

      if (ctx.session?.userId) {
        const userVotes = await ctx.db
          .select({
            projectId: projectVote.projectId,
          })
          .from(projectVote)
          .where(
            and(
              eq(projectVote.userId, ctx.session.userId),
              sql`${projectVote.projectId} in ${sql.raw(
                `(${launches.map((l) => `'${l.id}'`).join(',')})`,
              )}`,
            ),
          );

        const userVotesSet = new Set(userVotes.map((v) => v.projectId));

        return launches.map((launch) => ({
          ...launch,
          hasVoted: userVotesSet.has(launch.id),
        }));
      }

      return launches.map((launch) => ({
        ...launch,
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
          type: project.type,
          tags: project.tags,
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
        .leftJoin(user, eq(project.ownerId, user.id))
        .leftJoin(projectVote, eq(projectVote.projectId, project.id))
        .leftJoin(projectComment, eq(projectComment.projectId, project.id))
        .where(
          and(
            eq(project.approvalStatus, 'approved'),
            gte(projectLaunch.launchDate, startOfYesterday),
            lt(projectLaunch.launchDate, endOfYesterday),
          ),
        )
        .groupBy(
          project.id,
          projectLaunch.id,
          projectLaunch.tagline,
          projectLaunch.launchDate,
          projectLaunch.featured,
          user.id,
          user.name,
          user.username,
          user.image,
        )
        .orderBy(desc(sql`count(distinct ${projectVote.id})`), desc(projectLaunch.launchDate))
        .limit(input.limit)
        .offset(input.offset);

      return launches.map((launch) => ({
        ...launch,
        hasVoted: false,
      }));
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

      if (foundProject.ownerId !== ctx.session.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only launch your own projects',
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

      const [launch] = await ctx.db
        .insert(projectLaunch)
        .values({
          projectId: input.projectId,
          tagline: input.tagline,
          detailedDescription: input.detailedDescription,
        })
        .returning();

      return launch;
    }),
});
