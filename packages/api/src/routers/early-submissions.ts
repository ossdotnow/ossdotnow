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

const APPROVAL_STATUS = {
  APPROVED: 'approved',
  PENDING: 'pending',
  REJECTED: 'rejected',
} as const;

async function checkProjectDuplicate(db: any, gitRepoUrl: string) {
  const existingProject = await db.query.project.findFirst({
    where: eq(project.gitRepoUrl, gitRepoUrl),
    columns: {
      id: true,
      name: true,
      approvalStatus: true,
    },
  });

  if (!existingProject) {
    return { exists: false };
  }

  const statusMessage =
    existingProject.approvalStatus === APPROVAL_STATUS.APPROVED
      ? 'approved and is already listed'
      : existingProject.approvalStatus === APPROVAL_STATUS.PENDING
        ? 'pending review'
        : 'been submitted but was rejected';

  return {
    exists: true,
    projectName: existingProject.name,
    statusMessage,
    approvalStatus: existingProject.approvalStatus,
  };
}

export const earlySubmissionRouter = createTRPCRouter({
  checkDuplicateRepo: publicProcedure
    .input(z.object({ gitRepoUrl: z.string() }))
    .query(async ({ ctx, input }) => {
      return await checkProjectDuplicate(ctx.db, input.gitRepoUrl);
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

    const duplicateCheck = await checkProjectDuplicate(ctx.db, input.gitRepoUrl);

    if (duplicateCheck.exists) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: `This repository has already been submitted! The project "${duplicateCheck.projectName}" has ${duplicateCheck.statusMessage}. If you think this is an error, please contact support.`,
      });
    }

    await ctx.db.insert(project).values({
      ...input,
      ownerId: null,
      approvalStatus: APPROVAL_STATUS.PENDING,
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
