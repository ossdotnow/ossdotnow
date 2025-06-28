import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { getActiveDriver, type Context } from '../driver/utils';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { account, user } from '@workspace/db/schema';
import { and, eq } from 'drizzle-orm';

export const profileRouter = createTRPCRouter({
  getProfile: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      let profileUser: typeof user.$inferSelect;
      let targetId = input.id;
      if (input.id === 'me') {
        targetId = ctx.user.id;
        profileUser = {
          ...ctx.user,
          role: ctx.user.role ?? null,
          banned: ctx.user.banned ?? null,
          banReason: ctx.user.banReason ?? null,
          banExpires: ctx.user.banExpires ?? null,
        };
      } else {
        const dbUser = await ctx.db.query.user.findFirst({
          where: eq(user.id, input.id),
        });
        if (!dbUser) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }
        profileUser = dbUser;
      }

      const userAccount = await ctx.db.query.account.findFirst({
        where: eq(account.userId, targetId),
      });

      if (!userAccount || !userAccount.providerId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User account or provider not found',
        });
      }

      const driver = await getActiveDriver(
        userAccount.providerId as 'github' | 'gitlab',
        ctx as Context,
      );
      const userDetails = await driver.getUserDetails(profileUser.username);

      return {
        ...profileUser,
        git: userDetails,
        provider: userAccount.providerId,
      };
    }),
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
