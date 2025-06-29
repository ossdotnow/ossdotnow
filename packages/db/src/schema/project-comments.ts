import { pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { project } from './projects';
import { user } from './auth';

export const projectComment = pgTable(
  'project_comment',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .references(() => project.id, { onDelete: 'cascade' })
      .notNull(),
    userId: text('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    parentId: uuid('parent_id').references((): any => projectComment.id, {
      onDelete: 'cascade',
    }),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index('project_comment_project_id_idx').on(t.projectId),
    index('project_comment_user_id_idx').on(t.userId),
    index('project_comment_parent_id_idx').on(t.parentId),
  ],
);

export const projectCommentRelations = relations(projectComment, ({ one, many }) => ({
  project: one(project, {
    fields: [projectComment.projectId],
    references: [project.id],
  }),
  user: one(user, {
    fields: [projectComment.userId],
    references: [user.id],
  }),
  parent: one(projectComment, {
    fields: [projectComment.parentId],
    references: [projectComment.id],
    relationName: 'parent',
  }),
  replies: many(projectComment, {
    relationName: 'parent',
  }),
}));
