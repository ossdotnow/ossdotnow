import { categoryProjectTypes, categoryProjectStatuses, categoryTags } from '@workspace/db/schema';
import { project, projectTagRelations } from '@workspace/db/schema';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { getRateLimiter } from '../utils/rate-limit';
import { createInsertSchema } from 'drizzle-zod';
import { count, eq, inArray } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
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
    // Override enum validations to accept database values
    status: z.string().min(1, 'Project status is required'),
    type: z.string().min(1, 'Project type is required'),
    tags: z.array(z.string()).default([]),
  });

const APPROVAL_STATUS = {
  APPROVED: 'approved',
  PENDING: 'pending',
  REJECTED: 'rejected',
} as const;

// Helper functions for resolving names to IDs
async function resolveStatusId(db: any, statusName: string) {
  const status = await db.query.categoryProjectStatuses.findFirst({
    where: eq(categoryProjectStatuses.name, statusName),
    columns: { id: true },
  });
  if (!status) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Invalid status: ${statusName}`,
    });
  }
  return status.id;
}

async function resolveTypeId(db: any, typeName: string) {
  const type = await db.query.categoryProjectTypes.findFirst({
    where: eq(categoryProjectTypes.name, typeName),
    columns: { id: true },
  });
  if (!type) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Invalid type: ${typeName}`,
    });
  }
  return type.id;
}

async function resolveTagIds(db: any, tagNames: string[]) {
  if (tagNames.length === 0) return [];

  const tags = await db.query.categoryTags.findMany({
    where: inArray(categoryTags.name, tagNames),
    columns: { id: true, name: true },
  });

  const foundTagNames = tags.map((tag: any) => tag.name);
  const invalidTags = tagNames.filter((name) => !foundTagNames.includes(name));

  if (invalidTags.length > 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Invalid tags: ${invalidTags.join(', ')}`,
    });
  }

  return tags.map((tag: any) => tag.id);
}

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

    // Resolve string values to database IDs
    const statusId = await resolveStatusId(ctx.db, input.status);
    const typeId = await resolveTypeId(ctx.db, input.type);
    const tagIds = await resolveTagIds(ctx.db, input.tags);

    // Create the project
    const [newProject] = await ctx.db
      .insert(project)
      .values({
        ...input,
        ownerId: null,
        approvalStatus: APPROVAL_STATUS.PENDING,
        statusId,
        typeId,
      })
      .returning();

    // Create tag relationships
    if (tagIds.length > 0 && newProject) {
      await ctx.db.insert(projectTagRelations).values(
        tagIds.map((tagId: any) => ({
          projectId: newProject.id,
          tagId,
        })),
      );
    }

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
