import { APPROVAL_STATUS, checkProjectDuplicate, resolveAllIds } from '../utils/project-helpers';
import { project, projectTagRelations, projectClaim } from '@workspace/db/schema';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { getRateLimiter } from '../utils/rate-limit';
import { createInsertSchema } from 'drizzle-zod';
import { type Context } from '../driver/utils';
import { user } from '@workspace/db/schema';
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

async function checkUserOwnsProject(ctx: Context, gitRepoUrl: string) {
  const githubUrlRegex = /(?:https?:\/\/github\.com\/|^)([^/]+)\/([^/]+?)(?:\.git|\/|$)/;
  const match = gitRepoUrl.match(githubUrlRegex);
  let ownerId = null;
  const owner: string | undefined = match ? match[1] : undefined;

  if (typeof owner === 'string') {
    const userResult = await ctx.db.query.user.findFirst({
      where: eq(user.username, owner),
      columns: { id: true, username: true },
    });
    if (userResult) {
      ownerId = userResult.id;
      return { isOwner: true, ownerId, userResult, owner };
    } else {
      return {
        isOwner: false,
        owner,
      };
    }
  } else {
    return {
      isOwner: false,
      error: 'Invalid format. Use: username/repository',
    };
  }
}

export const submissionRouter = createTRPCRouter({
  checkDuplicateRepo: publicProcedure
    .input(z.object({ gitRepoUrl: z.string() }))
    .query(async ({ ctx, input }) => {
      return await checkProjectDuplicate(ctx.db, input.gitRepoUrl);
    }),
  checkUserOwnsProject: publicProcedure
    .input(z.object({ gitRepoUrl: z.string() }))
    .query(async ({ ctx, input }) => {
      return await checkUserOwnsProject(ctx, input.gitRepoUrl);
    }),
  addProject: publicProcedure.input(createProjectInput).mutation(async ({ ctx, input }) => {
    const limiter = getRateLimiter('submission');
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

    const ownerCheck = await checkUserOwnsProject(ctx, input.gitRepoUrl);
    if (ownerCheck.error) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: ownerCheck.error,
      });
    }
    const ownerId = ownerCheck.ownerId;
    const { statusId, typeId, tagIds } = await resolveAllIds(ctx.db, {
      status: input.status,
      type: input.type,
      tags: input.tags,
    });

    // Wrap only the atomic database operations in a transaction
    return await ctx.db.transaction(async (tx) => {
      const [newProject] = await tx
        .insert(project)
        .values({
          ...input,
          ownerId,
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
      if (ownerId && newProject?.id && ctx.session?.userId) {
        await tx.insert(projectClaim).values({
          projectId: newProject.id,
          userId: ctx.session.userId,
          success: true,
          verificationMethod: 'submission_username_match',
          verificationDetails: {
            verifiedAs: ownerCheck.userResult?.username || 'unknown',
            submissionMethod: 'auto_claim_during_submission',
            repositoryUrl: input.gitRepoUrl,
            matchedUsername: ownerCheck.owner,
          },
        });
      }

      const [totalCount] = await tx.select({ count: count() }).from(project);
      return {
        count: totalCount?.count ?? 0,
      };
    });
  }),
  getSubmissionsCount: publicProcedure.query(async ({ ctx }) => {
    const submissionsCount = await ctx.db.select({ count: count() }).from(project);

    if (!submissionsCount[0]) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get waitlist count',
      });
    }

    return {
      count: submissionsCount[0].count,
    };
  }),
});
