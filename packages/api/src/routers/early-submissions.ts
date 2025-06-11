import { createTRPCRouter, publicProcedure } from '../trpc';
import { getRateLimiter } from '../utils/rate-limit';
import { createInsertSchema } from 'drizzle-zod';
import { project } from '@workspace/db/schema';
import { TRPCError } from '@trpc/server';
import { count } from 'drizzle-orm';
import { getIp } from '../utils/ip';

const createProjectInput = createInsertSchema(project).omit({
  id: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const earlySubmissionRouter = createTRPCRouter({
  addProject: publicProcedure.input(createProjectInput).mutation(async ({ ctx, input }) => {
    const limiter = getRateLimiter('early-access-waitlist');
    if (limiter) {
      const ip = getIp(ctx.headers);
      const { success } = await limiter.limit(ip);

      if (!success) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many requests. Please try again later.',
        });
      }
    }

    return ctx.db
      .insert(project)
      .values({
        ...input,
        ownerId: null,
      })
      .returning();
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
