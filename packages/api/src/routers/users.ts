import { adminProcedure, createTRPCRouter } from '../trpc';
import z from 'zod/v4';

export const usersRouter = createTRPCRouter({
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
