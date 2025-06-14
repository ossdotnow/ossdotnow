import { index, pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { competitor } from './competitors';
import { project } from './projects';

export const alternativeCompetitorTypeEnum = pgEnum('alternative_competitor_type', [
  'project',
  'competitor',
]);

export const projectCompetitors = pgTable(
  'project_competitors',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    projectId: uuid('project_id')
      .references(() => project.id, { onDelete: 'cascade' })
      .notNull(),

    alternativeCompetitorType: alternativeCompetitorTypeEnum(
      'alternative_competitor_type',
    ).notNull(),

    alternativeProjectId: uuid('alternative_project_id').references(() => project.id, {
      onDelete: 'cascade',
    }),
    alternativeCompetitorId: uuid('alternative_competitor_id').references(() => competitor.id, {
      onDelete: 'cascade',
    }),

    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('project_competitors_project_id_idx').on(t.projectId),
    index('project_competitors_alt_project_id_idx').on(t.alternativeProjectId),
    index('project_competitors_alt_competitor_id_idx').on(t.alternativeCompetitorId),
    sql`CHECK (
      (${t.alternativeCompetitorType} = 'project' AND ${t.alternativeProjectId} IS NOT NULL AND ${t.alternativeCompetitorId} IS NULL) OR
      (${t.alternativeCompetitorType} = 'competitor' AND ${t.alternativeCompetitorId} IS NOT NULL AND ${t.alternativeProjectId} IS NULL)
    )`,
  ],
);

export const projectCompetitorsRelations = relations(projectCompetitors, ({ one }) => ({
  project: one(project, {
    fields: [projectCompetitors.projectId],
    references: [project.id],
    relationName: 'competitors',
  }),
  alternativeProject: one(project, {
    fields: [projectCompetitors.alternativeProjectId],
    references: [project.id],
    relationName: 'alternative_projects',
  }),
  alternativeCompetitor: one(competitor, {
    fields: [projectCompetitors.alternativeCompetitorId],
    references: [competitor.id],
    relationName: 'alternative_competitors',
  }),
}));
