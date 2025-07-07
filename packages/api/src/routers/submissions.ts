import { categoryProjectTypes, categoryProjectStatuses, categoryTags } from '@workspace/db/schema';
import { project, projectTagRelations } from '@workspace/db/schema';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { getRateLimiter } from '../utils/rate-limit';
import { createInsertSchema } from 'drizzle-zod';
import { count, eq, inArray } from 'drizzle-orm';
import { type Context } from '../driver/utils';
import { user } from '@workspace/db/schema';
import { TRPCError } from '@trpc/server';
import { type DB } from '@workspace/db';
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

// Type for transaction context
type TransactionDB = Parameters<Parameters<DB['transaction']>[0]>[0];

// Helper functions for resolving names to IDs (regular DB)
async function resolveStatusId(db: DB, statusName: string) {
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

async function resolveTypeId(db: DB, typeName: string) {
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

async function resolveTagIds(db: DB, tagNames: string[]) {
  if (tagNames.length === 0) return [];

  const tags = await db.query.categoryTags.findMany({
    where: inArray(categoryTags.name, tagNames),
    columns: { id: true, name: true },
  });

  const foundTagNames = tags.map((tag) => tag.name);
  const invalidTags = tagNames.filter((name) => !foundTagNames.includes(name));

  if (invalidTags.length > 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Invalid tags: ${invalidTags.join(', ')}`,
    });
  }

  return tags.map((tag) => tag.id);
}

// Transaction-compatible helper functions
async function resolveStatusIdTx(tx: TransactionDB, statusName: string) {
  const status = await tx.query.categoryProjectStatuses.findFirst({
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

async function resolveTypeIdTx(tx: TransactionDB, typeName: string) {
  const type = await tx.query.categoryProjectTypes.findFirst({
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

async function resolveTagIdsTx(tx: TransactionDB, tagNames: string[]) {
  if (tagNames.length === 0) return [];

  const tags = await tx.query.categoryTags.findMany({
    where: inArray(categoryTags.name, tagNames),
    columns: { id: true, name: true },
  });

  const foundTagNames = tags.map((tag) => tag.name);
  const invalidTags = tagNames.filter((name) => !foundTagNames.includes(name));

  if (invalidTags.length > 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Invalid tags: ${invalidTags.join(', ')}`,
    });
  }

  return tags.map((tag) => tag.id);
}

async function checkProjectDuplicate(db: DB, gitRepoUrl: string) {
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
      return { isOwner: true, ownerId };
    } else {
      return {
        isOwner: false,
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

    const duplicateCheck = await checkProjectDuplicate(ctx.db, input.gitRepoUrl);

    if (duplicateCheck.exists) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: `This repository has already been submitted! The project "${duplicateCheck.projectName}" has ${duplicateCheck.statusMessage}. If you think this is an error, please contact support.`,
      });
    }

    const ownerCheck = await checkUserOwnsProject(ctx, input.gitRepoUrl);
    if (ownerCheck.error) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: ownerCheck.error,
      });
    }
    const ownerId = ownerCheck.ownerId;

    // Wrap all database operations in a transaction
    return await ctx.db.transaction(async (tx) => {
      // Resolve string values to database IDs using transaction-compatible functions
      const statusId = await resolveStatusIdTx(tx, input.status);
      const typeId = await resolveTypeIdTx(tx, input.type);
      const tagIds = await resolveTagIdsTx(tx, input.tags);

      // Create the project
      const [newProject] = await tx
        .insert(project)
        .values({
          ...input,
          ownerId,
          approvalStatus: APPROVAL_STATUS.PENDING,
          statusId,
          typeId,
        })
        .returning();

      // Create tag relationships atomically
      if (tagIds.length > 0 && newProject?.id) {
        const tagRelations = tagIds.map((tagId: string) => ({
          projectId: newProject.id as string,
          tagId: tagId as string,
        }));
        await tx.insert(projectTagRelations).values(tagRelations);
      }

      return {
        count: count(),
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
