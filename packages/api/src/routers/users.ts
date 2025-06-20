import { adminProcedure, createTRPCRouter } from '../trpc';

export const usersRouter = createTRPCRouter({
  getUsers: adminProcedure.query(({ ctx }) => {
    return ctx.db.query.user.findMany();
  }),
});
