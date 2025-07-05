import { pgEnum } from 'drizzle-orm/pg-core';

export const gitHostEnum = pgEnum('git_host', ['github', 'gitlab']);
export const tagsEnum = pgEnum('tags', [
  'web',
  'mobile',
  'ai',
  'devtools',
  'cloud',
  'desktop',
  'backend',
  'frontend',
  'fullstack',
  'game',
  'crypto',
  'nft',
  'social',
  'other',
  'dapp',
  'saas',
  'algorithm',
  'data-analysis',
  'game-engine',
]);

export const userRoleEnum = pgEnum('user_role', ['admin', 'user', 'moderator']);

export const projectProviderEnum = pgEnum('project_provider', ['github', 'gitlab']);
