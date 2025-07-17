import { adminProcedure, createTRPCRouter, publicProcedure } from '../trpc';
import { user, type userRoleEnum } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';
import z from 'zod/v4';

export const usersRouter = createTRPCRouter({
  getUsername: publicProcedure.input(z.object({ id: z.string() })).query(({ ctx, input }) => {
    return ctx.db.query.user.findFirst({
      where: eq(user.id, input.id),
      columns: {
        username: true,
      },
    });
  }),
  getUsers: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(({ ctx, input }) => {
      return ctx.db.query.user.findMany({
        limit: input.limit,
        offset: input.offset,
        columns: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });
    }),
});
