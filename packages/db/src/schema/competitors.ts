import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { projectCompetitors } from './project-competitors';
import { gitHostEnum, tagsEnum } from './shared-enums';
import { relations } from 'drizzle-orm';

export const competitor = pgTable('competitor', {
  id: uuid('id').primaryKey().defaultRandom(),

  logoUrl: text('logo_url'),
  gitRepoUrl: text('git_repo_url'),
  gitHost: gitHostEnum('git_host'),
  name: text('name').notNull(),
  description: text('description'),
  socialLinks: jsonb('social_links').$type<{
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
    [key: string]: string | undefined;
  }>(),
  tags: tagsEnum('tags').array(),

  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
});

export const competitorRelations = relations(competitor, ({ many }) => ({
  projectCompetitors: many(projectCompetitors, { relationName: 'alternative_competitors' }),
}));
