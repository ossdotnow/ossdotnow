import { APPROVAL_STATUS, checkProjectDuplicate, resolveAllIds } from '../utils/project-helpers';
import { project, projectTagRelations } from '@workspace/db/schema';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { getRateLimiter } from '../utils/rate-limit';
import { createInsertSchema } from 'drizzle-zod';
import { TRPCError } from '@trpc/server';
import { count, eq } from 'drizzle-orm';
import { getIp } from '../utils/ip';
import { z } from 'zod/v4';

const createProjectInput = createInsertSchema(project)
  .omit({
    id: true,
    ownerId: true,
    statusId: true,
    typeId: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
  })
  .extend({
    status: z.string().min(1, 'Project status is required'),
    type: z.string().min(1, 'Project type is required'),
    tags: z.array(z.string()).default([]),
  });

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
          ownerId: null,
          approvalStatus: APPROVAL_STATUS.PENDING,
          statusId,
          typeId,
        })
        .onConflictDoNothing({ target: project.gitRepoUrl })
        .returning();

      if (!newProject) {
        const existing = await tx
          .select({
            name: project.name,
            approvalStatus: project.approvalStatus,
          })
          .from(project)
          .where(eq(project.gitRepoUrl, input.gitRepoUrl))
          .limit(1);

        const statusMsg =
          existing[0]?.approvalStatus === 'approved'
            ? 'approved and is already listed'
            : existing[0]?.approvalStatus === 'pending'
              ? 'pending review'
              : 'been submitted but was rejected';

        throw new TRPCError({
          code: 'CONFLICT',
          message: `This repository has already been submitted! The project "${existing[0]?.name}" has ${statusMsg}. If you think this is an error, please contact support.`,
        });
      }

      if (tagIds.length > 0 && newProject?.id) {
        const tagRelations = tagIds.map((tagId: string) => ({
          projectId: newProject.id as string,
          tagId: tagId as string,
        }));
        await tx.insert(projectTagRelations).values(tagRelations);
      }

      const [totalCount] = await tx.select({ count: count() }).from(project);

      return {
        project: newProject,
        totalCount: totalCount?.count ?? 0,
      };
    });
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
