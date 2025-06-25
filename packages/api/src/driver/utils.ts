import type { createTRPCContext } from '../trpc';
import { account } from '@workspace/db/schema';
import { env } from '@workspace/env/server';
import { eq, and } from 'drizzle-orm';
import { createDriver } from '.';

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
export type Provider = 'github' | 'gitlab';

export const getActiveDriver = async (provider: Provider, ctx?: Context) => {
  if (ctx?.user?.id) {
    const userAccount = await ctx.db
      .select({
        accessToken: account.accessToken,
      })
      .from(account)
      .where(and(eq(account.userId, ctx.user.id), eq(account.providerId, provider)))
      .limit(1);

    if (userAccount[0]?.accessToken) {
      return createDriver(provider, { token: userAccount[0].accessToken });
    }
  }

  // Fallback to global tokens
  const token = provider === 'github' ? env.GITHUB_TOKEN : env.GITLAB_TOKEN;

  if (!token) {
    throw new Error(`No token found for provider: ${provider}`);
  }

  return createDriver(provider, { token });
};
