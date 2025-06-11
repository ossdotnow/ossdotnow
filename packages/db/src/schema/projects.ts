import { boolean, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { projectCompetitors } from './project-competitors';
import { gitHostEnum, tagsEnum } from './shared-enums';
import { competitor } from './competitors';
import { relations } from 'drizzle-orm';
import { user } from './auth';

export const acquisitionTypeEnum = pgEnum('acquisition_type', ['ipo', 'acquisition', 'other']);
export const projectApprovalStatusEnum = pgEnum('project_approval_status', [
  'pending',
  'approved',
  'rejected',
]);
export const projectStatusEnum = pgEnum('project_status', [
  'active',
  'inactive',
  'early-stage',
  'beta',
  'production-ready',
  'experimental',
  'cancelled',
  'paused',
]);
export const projectTypeEnum = pgEnum('project_type', [
  'fintech',
  'healthtech',
  'edtech',
  'ecommerce',
  'productivity',
  'social',
  'entertainment',
  'developer-tools',
  'content-management',
  'analytics',
  'other',
]);

export const project = pgTable('project', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: text('owner_id').references(() => user.id, { onDelete: 'set null' }),

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

  approvalStatus: projectApprovalStatusEnum('approval_status').notNull().default('pending'),

  status: projectStatusEnum('status').notNull(),
  type: projectTypeEnum('type').notNull(),

  isLookingForContributors: boolean('is_looking_for_contributors').notNull(),
  isLookingForInvestors: boolean('is_looking_for_investors').notNull(),
  isHiring: boolean('is_hiring').notNull(),
  isPublic: boolean('is_public').notNull(),
  hasBeenAcquired: boolean('has_been_acquired').notNull(),
  acquiredBy: uuid('acquired_by').references(() => competitor.id, { onDelete: 'set null' }),

  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const projectRelations = relations(project, ({ one, many }) => ({
  owner: one(user, {
    fields: [project.ownerId],
    references: [user.id],
  }),
  competitors: many(projectCompetitors, { relationName: 'competitors' }),
  acquiringCompetitor: one(competitor, {
    fields: [project.acquiredBy],
    references: [competitor.id],
    relationName: 'acquirer',
  }),
  alternativeProjects: many(projectCompetitors, { relationName: 'alternative_projects' }),
  alternativeCompetitors: many(projectCompetitors, { relationName: 'alternative_competitors' }),
}));
