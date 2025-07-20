import { categoryProjectTypes, categoryProjectStatuses, categoryTags } from '@workspace/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { project } from '@workspace/db/schema';
import { TRPCError } from '@trpc/server';
import { type DB } from '@workspace/db';
export const APPROVAL_STATUS = {
  APPROVED: 'approved',
  PENDING: 'pending',
  REJECTED: 'rejected',
} as const;

export async function resolveStatusId(db: DB, statusName: string) {
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

export async function resolveTypeId(db: DB, typeName: string) {
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

export async function resolveTagIds(db: DB, tagNames: string[]) {
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
export async function checkProjectDuplicate(db: DB, gitRepoUrl: string, projectId?: string) {
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

  // If editing and the found project is the same as the one being edited, skip duplicate
  if (projectId && existingProject.id === projectId) {
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
export async function resolveAllIds(
  db: DB,
  input: { status: string; type: string; tags: string[] },
) {
  const statusId = await resolveStatusId(db, input.status);
  const typeId = await resolveTypeId(db, input.type);
  const tagIds = await resolveTagIds(db, input.tags);

  return {
    statusId,
    typeId,
    tagIds,
  };
}
