import { pgTable, text, timestamp, uuid, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { project } from './projects';
import { user } from './auth';

export const projectVote = pgTable(
  'project_vote',
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
    index('project_vote_project_id_idx').on(t.projectId),
    index('project_vote_user_id_idx').on(t.userId),
  ],
);

export const projectVoteRelations = relations(projectVote, ({ one }) => ({
  project: one(project, {
    fields: [projectVote.projectId],
    references: [project.id],
  }),
  user: one(user, {
    fields: [projectVote.userId],
    references: [user.id],
  }),
}));
