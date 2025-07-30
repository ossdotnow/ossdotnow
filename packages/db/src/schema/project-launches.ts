import { pgTable, text, timestamp, uuid, boolean, index, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { project } from './projects';

export const launchStatusEnum = pgEnum('launch_status', ['scheduled', 'live', 'ended']);

export const projectLaunch = pgTable(
  'project_launch',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .references(() => project.id, { onDelete: 'cascade' })
      .notNull(),
    tagline: text('tagline').notNull(),
    detailedDescription: text('detailed_description'),
    launchDate: timestamp('launch_date', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
    status: launchStatusEnum('status').default('scheduled').notNull(),
    featured: boolean('featured').default(false).notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index('project_launch_project_id_idx').on(t.projectId),
    index('project_launch_launch_date_idx').on(t.launchDate),
    index('project_launch_status_idx').on(t.status),
  ],
);

export const projectLaunchRelations = relations(projectLaunch, ({ one }) => ({
  project: one(project, {
    fields: [projectLaunch.projectId],
    references: [project.id],
  }),
}));
