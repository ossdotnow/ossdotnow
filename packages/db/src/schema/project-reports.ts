import { pgTable, text, timestamp, uuid, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { project } from './projects';
import { user } from './auth';

export const projectReport = pgTable(
  'project_report',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .references(() => project.id, { onDelete: 'cascade' })
      .notNull(),
    userId: text('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique().on(t.projectId, t.userId),
    index('project_report_project_id_idx').on(t.projectId),
    index('project_report_user_id_idx').on(t.userId),
  ],
);

export const projectReportRelations = relations(projectReport, ({ one }) => ({
  project: one(project, {
    fields: [projectReport.projectId],
    references: [project.id],
  }),
  user: one(user, {
    fields: [projectReport.userId],
    references: [user.id],
  }),
}));
