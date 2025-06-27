import { createTRPCRouter, publicProcedure } from '../trpc';
import { getRateLimiter } from '../utils/rate-limit';
import { createInsertSchema } from 'drizzle-zod';
import { project } from '@workspace/db/schema';
import { TRPCError } from '@trpc/server';
import { count, eq } from 'drizzle-orm';
import { getIp } from '../utils/ip';
import { z } from 'zod/v4';

const createProjectInput = createInsertSchema(project).omit({
  id: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const earlySubmissionRouter = createTRPCRouter({
  checkDuplicateRepo: publicProcedure
    .input(z.object({ gitRepoUrl: z.string() }))
    .query(async ({ ctx, input }) => {
      const existingProject = await ctx.db.query.project.findFirst({
        where: eq(project.gitRepoUrl, input.gitRepoUrl),
        columns: {
          id: true,
          name: true,
          approvalStatus: true,
        },
      });

      if (existingProject) {
        const statusMessage =
          existingProject.approvalStatus === 'approved'
            ? 'approved and is already listed'
            : existingProject.approvalStatus === 'pending'
              ? 'pending review'
              : 'been submitted but was rejected';

        return {
          exists: true,
          projectName: existingProject.name,
          statusMessage,
          approvalStatus: existingProject.approvalStatus,
        };
      }

      return {
        exists: false,
      };
    }),
  addProject: publicProcedure.input(createProjectInput).mutation(async ({ ctx, input }) => {
    const limiter = getRateLimiter('early-access-waitlist');
    if (limiter) {
      const ip = getIp(ctx.headers);
      const safeIp = ip || `anonymous-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const { success } = await limiter.limit(safeIp);

      if (!success) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many requests. Please try again later.',
        });
      }
    }

    const existingProject = await ctx.db.query.project.findFirst({
      where: eq(project.gitRepoUrl, input.gitRepoUrl),
      columns: {
        id: true,
        name: true,
        approvalStatus: true,
      },
    });

    if (existingProject) {
      const statusMessage =
        existingProject.approvalStatus === 'approved'
          ? 'approved and is already listed'
          : existingProject.approvalStatus === 'pending'
            ? 'pending review'
            : 'been submitted but was rejected';

      throw new TRPCError({
        code: 'CONFLICT',
        message: `This repository has already been submitted! The project "${existingProject.name}" has ${statusMessage}. If you think this is an error, please contact support.`,
      });
    }

    await ctx.db.insert(project).values({
      ...input,
      ownerId: null,
      approvalStatus: 'pending',
    });

    return {
      count: count(),
    };
  }),
  getEarlySubmissionsCount: publicProcedure.query(async ({ ctx }) => {
    const earlySubmissionsCount = await ctx.db.select({ count: count() }).from(project);

    if (!earlySubmissionsCount[0]) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get waitlist count',
      });
    }

    return {
      count: earlySubmissionsCount[0].count,
    };
  }),
});
