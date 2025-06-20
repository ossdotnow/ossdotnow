import { pgEnum } from 'drizzle-orm/pg-core';

export const gitHostEnum = pgEnum('git_host', ['github', 'gitlab']);
export const tagsEnum = pgEnum('tags', [
  'web',
  'mobile',
  'desktop',
  'backend',
  'frontend',
  'fullstack',
  'ai',
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
