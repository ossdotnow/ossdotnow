import { pgTable, text, timestamp, uuid, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { project } from './projects';
import { user } from './auth';

export const projectClaim = pgTable('project_claim', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => project.id, { onDelete: 'cascade' })
    .notNull(),
  userId: text('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull(),

  success: boolean('success').notNull(),
  verificationMethod: text('verification_method').notNull(),
  verificationDetails: jsonb('verification_details'),
  errorReason: text('error_reason'),

  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
});

export const projectClaimRelations = relations(projectClaim, ({ one }) => ({
  project: one(project, {
    fields: [projectClaim.projectId],
    references: [project.id],
  }),
  user: one(user, {
    fields: [projectClaim.userId],
    references: [user.id],
  }),
}));
