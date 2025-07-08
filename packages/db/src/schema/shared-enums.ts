import { pgEnum } from 'drizzle-orm/pg-core';

export const gitHostEnum = pgEnum('git_host', ['github', 'gitlab']);
export const userRoleEnum = pgEnum('user_role', ['admin', 'user', 'moderator']);
export const projectProviderEnum = pgEnum('project_provider', ['github', 'gitlab']);

// Remove the old enums that we're migrating to tables:
// - tagsEnum (now in categoryTags table)
// - projectStatusEnum (now in categoryProjectStatuses table)
// - projectTypeEnum (now in categoryProjectTypes table)
