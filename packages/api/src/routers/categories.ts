import { categoryTags, categoryProjectTypes, categoryProjectStatuses } from '@workspace/db/schema';
import { createTRPCRouter, adminProcedure, publicProcedure } from '../trpc';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { and, asc, eq } from 'drizzle-orm';
import { z } from 'zod/v4';

// Zod schemas for validation
const insertTagSchema = createInsertSchema(categoryTags).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
const insertProjectTypeSchema = createInsertSchema(categoryProjectTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
const insertProjectStatusSchema = createInsertSchema(categoryProjectStatuses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const updateTagSchema = insertTagSchema.partial().extend({ id: z.string().uuid() });
const updateProjectTypeSchema = insertProjectTypeSchema.partial().extend({ id: z.string().uuid() });
const updateProjectStatusSchema = insertProjectStatusSchema
  .partial()
  .extend({ id: z.string().uuid() });

export const categoriesRouter = createTRPCRouter({
  // Tags CRUD
  getTags: publicProcedure
    .input(z.object({ activeOnly: z.boolean().default(false) }).optional())
    .query(async ({ ctx, input }) => {
      const whereClause = input?.activeOnly ? eq(categoryTags.isActive, true) : undefined;

      return ctx.db.query.categoryTags.findMany({
        where: whereClause,
        orderBy: [asc(categoryTags.sortOrder), asc(categoryTags.name)],
      });
    }),

  createTag: adminProcedure.input(insertTagSchema).mutation(async ({ ctx, input }) => {
    return ctx.db.insert(categoryTags).values(input).returning();
  }),

  updateTag: adminProcedure.input(updateTagSchema).mutation(async ({ ctx, input }) => {
    const { id, ...updateData } = input;
    return ctx.db.update(categoryTags).set(updateData).where(eq(categoryTags.id, id)).returning();
  }),

  deleteTag: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.delete(categoryTags).where(eq(categoryTags.id, input.id)).returning();
    }),

  toggleTagStatus: adminProcedure
    .input(z.object({ id: z.string().uuid(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db
        .update(categoryTags)
        .set({ isActive: input.isActive })
        .where(eq(categoryTags.id, input.id))
        .returning();
    }),

  // Project Types CRUD
  getProjectTypes: publicProcedure
    .input(z.object({ activeOnly: z.boolean().default(false) }).optional())
    .query(async ({ ctx, input }) => {
      const whereClause = input?.activeOnly ? eq(categoryProjectTypes.isActive, true) : undefined;

      return ctx.db.query.categoryProjectTypes.findMany({
        where: whereClause,
        orderBy: [asc(categoryProjectTypes.sortOrder), asc(categoryProjectTypes.name)],
      });
    }),

  createProjectType: adminProcedure
    .input(insertProjectTypeSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.insert(categoryProjectTypes).values(input).returning();
    }),

  updateProjectType: adminProcedure
    .input(updateProjectTypeSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      return ctx.db
        .update(categoryProjectTypes)
        .set(updateData)
        .where(eq(categoryProjectTypes.id, id))
        .returning();
    }),

  deleteProjectType: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db
        .delete(categoryProjectTypes)
        .where(eq(categoryProjectTypes.id, input.id))
        .returning();
    }),

  toggleProjectTypeStatus: adminProcedure
    .input(z.object({ id: z.string().uuid(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db
        .update(categoryProjectTypes)
        .set({ isActive: input.isActive })
        .where(eq(categoryProjectTypes.id, input.id))
        .returning();
    }),

  // Project Statuses CRUD
  getProjectStatuses: publicProcedure
    .input(z.object({ activeOnly: z.boolean().default(false) }).optional())
    .query(async ({ ctx, input }) => {
      const whereClause = input?.activeOnly
        ? eq(categoryProjectStatuses.isActive, true)
        : undefined;

      return ctx.db.query.categoryProjectStatuses.findMany({
        where: whereClause,
        orderBy: [asc(categoryProjectStatuses.sortOrder), asc(categoryProjectStatuses.name)],
      });
    }),

  createProjectStatus: adminProcedure
    .input(insertProjectStatusSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.insert(categoryProjectStatuses).values(input).returning();
    }),

  updateProjectStatus: adminProcedure
    .input(updateProjectStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      return ctx.db
        .update(categoryProjectStatuses)
        .set(updateData)
        .where(eq(categoryProjectStatuses.id, id))
        .returning();
    }),

  deleteProjectStatus: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db
        .delete(categoryProjectStatuses)
        .where(eq(categoryProjectStatuses.id, input.id))
        .returning();
    }),

  toggleProjectStatusStatus: adminProcedure
    .input(z.object({ id: z.string().uuid(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db
        .update(categoryProjectStatuses)
        .set({ isActive: input.isActive })
        .where(eq(categoryProjectStatuses.id, input.id))
        .returning();
    }),

  // Bulk operations for reordering
  reorderTags: adminProcedure
    .input(z.array(z.object({ id: z.string().uuid(), sortOrder: z.number() })))
    .mutation(async ({ ctx, input }) => {
      const updates = input.map(({ id, sortOrder }) =>
        ctx.db.update(categoryTags).set({ sortOrder }).where(eq(categoryTags.id, id)),
      );
      await Promise.all(updates);
      return { success: true };
    }),

  reorderProjectTypes: adminProcedure
    .input(z.array(z.object({ id: z.string().uuid(), sortOrder: z.number() })))
    .mutation(async ({ ctx, input }) => {
      const updates = input.map(({ id, sortOrder }) =>
        ctx.db
          .update(categoryProjectTypes)
          .set({ sortOrder })
          .where(eq(categoryProjectTypes.id, id)),
      );
      await Promise.all(updates);
      return { success: true };
    }),

  reorderProjectStatuses: adminProcedure
    .input(z.array(z.object({ id: z.string().uuid(), sortOrder: z.number() })))
    .mutation(async ({ ctx, input }) => {
      const updates = input.map(({ id, sortOrder }) =>
        ctx.db
          .update(categoryProjectStatuses)
          .set({ sortOrder })
          .where(eq(categoryProjectStatuses.id, id)),
      );
      await Promise.all(updates);
      return { success: true };
    }),
});
