import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { createInsertSchema } from 'drizzle-zod';
import { project } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const createProjectInput = createInsertSchema(project);

export const projectsRouter = createTRPCRouter({
  getProjects: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.project.findMany();
  }),
  getProject: publicProcedure.input(z.object({ id: z.string() })).query(({ ctx, input }) => {
    return ctx.db.query.project.findFirst({
      where: eq(project.id, input.id),
    });
  }),
  addProject: protectedProcedure.input(createProjectInput).mutation(async ({ ctx, input }) => {
    return ctx.db
      .insert(project)
      .values({
        ...input,
        ownerId: ctx.session.userId,
      })
      .returning();
  }),
  updateProject: protectedProcedure.input(createProjectInput).mutation(async ({ ctx, input }) => {
    if (!input.id) throw new Error('Project ID is required for update');
    return ctx.db.update(project).set(input).where(eq(project.id, input.id)).returning();
  }),
  deleteProject: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db
        .update(project)
        .set({ deletedAt: new Date() })
        .where(eq(project.id, input.id))
        .returning();
    }),
});
