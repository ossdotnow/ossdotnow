import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const categoryTags = pgTable('category_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(), // Internal name (e.g., 'web', 'mobile')
  displayName: text('display_name').notNull(), // Display name (e.g., 'Web Development', 'Mobile Apps')
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const categoryProjectTypes = pgTable('category_project_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(), // Internal name (e.g., 'fintech', 'healthtech')
  displayName: text('display_name').notNull(), // Display name (e.g., 'Financial Technology', 'Health Technology')
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const categoryProjectStatuses = pgTable('category_project_statuses', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(), // Internal name (e.g., 'active', 'inactive')
  displayName: text('display_name').notNull(), // Display name (e.g., 'Active', 'Inactive')
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Relations (optional - for future use if needed)
export const categoryTagsRelations = relations(categoryTags, () => ({}));
export const categoryProjectTypesRelations = relations(categoryProjectTypes, () => ({}));
export const categoryProjectStatusesRelations = relations(categoryProjectStatuses, () => ({}));
