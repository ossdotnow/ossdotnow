import { pgEnum } from 'drizzle-orm/pg-core';

export const gitHostEnum = pgEnum('git_host', ['github', 'gitlab']);
export const userRoleEnum = pgEnum('user_role', ['admin', 'user', 'moderator']);
export const projectProviderEnum = pgEnum('project_provider', ['github', 'gitlab']);
export const roleEnum = pgEnum('role', ['user', 'moderator', 'admin']);
