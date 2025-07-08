import { categoryTags, categoryProjectTypes, categoryProjectStatuses } from '@workspace/db/schema';
import { createTRPCRouter, adminProcedure, publicProcedure } from '../trpc';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { and, asc, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { z } from 'zod/v4';

// Utility function to slugify category names
function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/[^a-z0-9-]/g, '') // Remove special characters except dashes
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .replace(/^-|-$/g, ''); // Remove leading/trailing dashes
}

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
    .input(
      z
        .object({
          activeOnly: z.boolean().default(true),
        })
        .optional()
        .default({ activeOnly: true }),
    )
    .query(async ({ ctx, input }) => {
      const whereClause = input?.activeOnly ? eq(categoryTags.isActive, true) : undefined;

      return ctx.db.query.categoryTags.findMany({
        where: whereClause,
        orderBy: [asc(categoryTags.sortOrder), asc(categoryTags.displayName)],
      });
    }),

  createTag: adminProcedure.input(insertTagSchema).mutation(async ({ ctx, input }) => {
    return ctx.db
      .insert(categoryTags)
      .values({
        ...input,
        name: slugifyName(input.name),
      })
      .returning();
  }),

  updateTag: adminProcedure.input(updateTagSchema).mutation(async ({ ctx, input }) => {
    const { id, ...updateData } = input;
    // Slugify name if it's being updated
    if (updateData.name) {
      updateData.name = slugifyName(updateData.name);
    }
    const [updatedTag] = await ctx.db
      .update(categoryTags)
      .set(updateData)
      .where(eq(categoryTags.id, id))
      .returning();

    if (!updatedTag) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Tag not found',
      });
    }

    return updatedTag;
  }),

  deleteTag: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deletedTag] = await ctx.db
        .delete(categoryTags)
        .where(eq(categoryTags.id, input.id))
        .returning();

      if (!deletedTag) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tag not found',
        });
      }

      return deletedTag;
    }),

  toggleTagStatus: adminProcedure
    .input(z.object({ id: z.string().uuid(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const [updatedTag] = await ctx.db
        .update(categoryTags)
        .set({ isActive: input.isActive })
        .where(eq(categoryTags.id, input.id))
        .returning();

      if (!updatedTag) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tag not found',
        });
      }

      return updatedTag;
    }),

  // Project Types CRUD
  getProjectTypes: publicProcedure
    .input(
      z
        .object({
          activeOnly: z.boolean().default(true),
        })
        .optional()
        .default({ activeOnly: true }),
    )
    .query(async ({ ctx, input }) => {
      const whereClause = input?.activeOnly ? eq(categoryProjectTypes.isActive, true) : undefined;

      return ctx.db.query.categoryProjectTypes.findMany({
        where: whereClause,
        orderBy: [asc(categoryProjectTypes.sortOrder), asc(categoryProjectTypes.displayName)],
      });
    }),

  createProjectType: adminProcedure
    .input(insertProjectTypeSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db
        .insert(categoryProjectTypes)
        .values({
          ...input,
          name: slugifyName(input.name),
        })
        .returning();
    }),

  updateProjectType: adminProcedure
    .input(updateProjectTypeSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      // Slugify name if it's being updated
      if (updateData.name) {
        updateData.name = slugifyName(updateData.name);
      }
      const [updatedProjectType] = await ctx.db
        .update(categoryProjectTypes)
        .set(updateData)
        .where(eq(categoryProjectTypes.id, id))
        .returning();

      if (!updatedProjectType) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project type not found',
        });
      }

      return updatedProjectType;
    }),

  deleteProjectType: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deletedProjectType] = await ctx.db
        .delete(categoryProjectTypes)
        .where(eq(categoryProjectTypes.id, input.id))
        .returning();

      if (!deletedProjectType) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project type not found',
        });
      }

      return deletedProjectType;
    }),

  toggleProjectTypeStatus: adminProcedure
    .input(z.object({ id: z.string().uuid(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const [updatedProjectType] = await ctx.db
        .update(categoryProjectTypes)
        .set({ isActive: input.isActive })
        .where(eq(categoryProjectTypes.id, input.id))
        .returning();

      if (!updatedProjectType) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project type not found',
        });
      }

      return updatedProjectType;
    }),

  // Project Statuses CRUD
  getProjectStatuses: publicProcedure
    .input(
      z
        .object({
          activeOnly: z.boolean().default(true),
        })
        .optional()
        .default({ activeOnly: true }),
    )
    .query(async ({ ctx, input }) => {
      const whereClause = input?.activeOnly
        ? eq(categoryProjectStatuses.isActive, true)
        : undefined;

      return ctx.db.query.categoryProjectStatuses.findMany({
        where: whereClause,
        orderBy: [asc(categoryProjectStatuses.sortOrder), asc(categoryProjectStatuses.displayName)],
      });
    }),

  createProjectStatus: adminProcedure
    .input(insertProjectStatusSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db
        .insert(categoryProjectStatuses)
        .values({
          ...input,
          name: slugifyName(input.name),
        })
        .returning();
    }),

  updateProjectStatus: adminProcedure
    .input(updateProjectStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      // Slugify name if it's being updated
      if (updateData.name) {
        updateData.name = slugifyName(updateData.name);
      }
      const [updatedProjectStatus] = await ctx.db
        .update(categoryProjectStatuses)
        .set(updateData)
        .where(eq(categoryProjectStatuses.id, id))
        .returning();

      if (!updatedProjectStatus) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project status not found',
        });
      }

      return updatedProjectStatus;
    }),

  deleteProjectStatus: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deletedProjectStatus] = await ctx.db
        .delete(categoryProjectStatuses)
        .where(eq(categoryProjectStatuses.id, input.id))
        .returning();

      if (!deletedProjectStatus) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project status not found',
        });
      }

      return deletedProjectStatus;
    }),

  toggleProjectStatusStatus: adminProcedure
    .input(z.object({ id: z.string().uuid(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const [updatedProjectStatus] = await ctx.db
        .update(categoryProjectStatuses)
        .set({ isActive: input.isActive })
        .where(eq(categoryProjectStatuses.id, input.id))
        .returning();

      if (!updatedProjectStatus) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project status not found',
        });
      }

      return updatedProjectStatus;
    }),

  // Bulk operations for reordering
  reorderTags: adminProcedure
    .input(z.array(z.object({ id: z.string().uuid(), sortOrder: z.number() })))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        for (const { id, sortOrder } of input) {
          await tx.update(categoryTags).set({ sortOrder }).where(eq(categoryTags.id, id));
        }
        return { success: true };
      });
    }),

  reorderProjectTypes: adminProcedure
    .input(z.array(z.object({ id: z.string().uuid(), sortOrder: z.number() })))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        for (const { id, sortOrder } of input) {
          await tx
            .update(categoryProjectTypes)
            .set({ sortOrder })
            .where(eq(categoryProjectTypes.id, id));
        }
        return { success: true };
      });
    }),

  reorderProjectStatuses: adminProcedure
    .input(z.array(z.object({ id: z.string().uuid(), sortOrder: z.number() })))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        for (const { id, sortOrder } of input) {
          await tx
            .update(categoryProjectStatuses)
            .set({ sortOrder })
            .where(eq(categoryProjectStatuses.id, id));
        }
        return { success: true };
      });
    }),

  getProjectStatus: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.categoryProjectStatuses.findFirst({
        where: eq(categoryProjectStatuses.id, input.id),
      });
    }),

  getProjectType: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.categoryProjectTypes.findFirst({
        where: eq(categoryProjectTypes.id, input.id),
      });
    }),

  getTag: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return ctx.db.query.categoryTags.findFirst({
      where: eq(categoryTags.id, input.id),
    });
  }),
});
