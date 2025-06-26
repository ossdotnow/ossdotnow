import { createTRPCRouter, protectedProcedure } from '../trpc';
import { user } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';
import z from 'zod';

export const userRouter = createTRPCRouter({
  me: protectedProcedure.query(({ ctx }) => {
    return {
      ...ctx.user,
      session: {
        id: ctx.session.id,
        ipAddress: ctx.session.ipAddress,
        userAgent: ctx.session.userAgent,
      },
    };
  }),
  get: protectedProcedure.input(z.string()).query(({ ctx, input }) => {
    if (input === 'me') {
      return {
        id: ctx.user.id,
        name: ctx.user.name,
        image: ctx.user.image,
      };
    }
    const userData = ctx.db.query.user.findFirst({
      where: eq(user.id, input),
    });
    return userData;
  }),
});
