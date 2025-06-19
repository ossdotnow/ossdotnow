import { createTRPCRouter, publicProcedure } from '../trpc';
import { getRateLimiter } from '../utils/rate-limit';
import { waitlist } from '@workspace/db/schema';
import { TRPCError } from '@trpc/server';
import { count, eq } from 'drizzle-orm';
import { getIp } from '../utils/ip';
import { z } from 'zod/v4';

export const earlyAccessRouter = createTRPCRouter({
  getWaitlistCount: publicProcedure.query(async ({ ctx }) => {
    const waitlistCount = await ctx.db.select({ count: count() }).from(waitlist);

    if (!waitlistCount[0]) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get waitlist count',
      });
    }

    return {
      count: waitlistCount[0].count,
    };
  }),
  joinWaitlist: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const limiter = getRateLimiter('early-access-waitlist');
      if (limiter) {
        const ip = getIp(ctx.headers);
        const { success } = await limiter.limit(ip);

        if (!success) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many requests. Please try again later.',
          });
        }
      }

      const userAlreadyInWaitlist = await ctx.db
        .select()
        .from(waitlist)
        .where(eq(waitlist.email, input.email));

      if (userAlreadyInWaitlist[0]) {
        return { message: "You're already on the waitlist!" };
      }

      await ctx.db.insert(waitlist).values({
        email: input.email,
      });

      return { message: "You've been added to the waitlist!" };
    }),
});
