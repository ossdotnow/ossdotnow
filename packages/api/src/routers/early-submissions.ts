import { createTRPCRouter, publicProcedure } from '../trpc';
import { createInsertSchema } from 'drizzle-zod';
import { project } from '@workspace/db/schema';

const createProjectInput = createInsertSchema(project);

export const earlySubmissionRouter = createTRPCRouter({
  addProject: publicProcedure.input(createProjectInput).mutation(async ({ ctx, input }) => {
    return ctx.db
      .insert(project)
      .values({
        ...input,
        ownerId: null,
      })
      .returning();
  }),
});
