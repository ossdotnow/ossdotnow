import { createTRPCRouter, protectedProcedure } from '../trpc';
import { getActiveDriver } from '../driver/utils';
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
  get: protectedProcedure.input(z.object({ id: z.string() })).query(({ ctx, input }) => {
    if (input.id === 'me') {
      return {
        id: ctx.user.id,
        name: ctx.user.name,
        image: ctx.user.image,
      };
    }
    const userData = ctx.db.query.user.findFirst({
      where: eq(user.id, input.id),
    });
    return userData;
  }),
  getContributions: protectedProcedure
    .input(
      z.object({
        username: z.string(),
        provider: z.enum(['github', 'gitlab']),
        id: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const gitHubDriver = await getActiveDriver('github');
      const gitLabDriver = await getActiveDriver('gitlab');

      const gitHubContributions = await gitHubDriver.getContributions(input.username);
      const gitLabContributions = await gitLabDriver.getContributions(input.username);

      const mergedContributions = {
        totalContributions:
          gitHubContributions.totalContributions + gitLabContributions.totalContributions,
        days: [...gitHubContributions.days, ...gitLabContributions.days],
      };

      return mergedContributions;
    }),
});
