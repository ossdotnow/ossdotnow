import { jsonb, pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { projectCompetitors } from './project-competitors';
import { gitHostEnum } from './shared-enums';
import { categoryTags } from './categories';
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

  // Remove the old tags enum array - replaced with many-to-many relationship
  // tags: tagsEnum('tags').array(),

  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Many-to-many relationship table for competitor tags
export const competitorTagRelations = pgTable('competitor_tag_relations', {
  id: uuid('id').primaryKey().defaultRandom(),
  competitorId: uuid('competitor_id')
    .references(() => competitor.id, { onDelete: 'cascade' })
    .notNull(),
  tagId: uuid('tag_id')
    .references(() => categoryTags.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  competitorIdIdx: index('competitor_tag_relations_competitor_id_idx').on(table.competitorId),
  tagIdIdx: index('competitor_tag_relations_tag_id_idx').on(table.tagId),
  uniqueCompetitorTag: index('unique_competitor_tag').on(table.competitorId, table.tagId),
}));

export const competitorRelations = relations(competitor, ({ many }) => ({
  projectCompetitors: many(projectCompetitors, { relationName: 'alternative_competitors' }),
  tagRelations: many(competitorTagRelations),
}));

export const competitorTagRelationsRelations = relations(competitorTagRelations, ({ one }) => ({
  competitor: one(competitor, {
    fields: [competitorTagRelations.competitorId],
    references: [competitor.id],
  }),
  tag: one(categoryTags, {
    fields: [competitorTagRelations.tagId],
    references: [categoryTags.id],
  }),
}));
