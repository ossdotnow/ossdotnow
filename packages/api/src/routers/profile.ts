import { createTRPCRouter, publicProcedure } from '../trpc';
import { getActiveDriver } from '../driver/utils';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const profileRouter = createTRPCRouter({
  gitDetails: publicProcedure
    .input(
      z.object({
        provider: z.enum(['github', 'gitlab']),
        username: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { provider, username } = input;

      try {
        const driver = await getActiveDriver(provider, ctx);
        const userDetails = await driver.getUserDetails(username);
        return userDetails;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user details',
        });
      }
    }),
});
