import { createTRPCRouter, protectedProcedure } from '../trpc';
import { account } from '@workspace/db/schema';
import { TRPCError } from '@trpc/server';
import { eq, and } from 'drizzle-orm';

export const profileRouter = createTRPCRouter({
  githubDetails: protectedProcedure.query(async ({ ctx }) => {
    const githubAccounts = await ctx.db
      .select()
      .from(account)
      .where(and(eq(account.userId, ctx.user.id), eq(account.providerId, 'github')));

    if (!githubAccounts[0] || !githubAccounts[0].accessToken) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'GitHub account not found or access token missing',
      });
    }

    const accessToken = githubAccounts[0].accessToken;

    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `GitHub API error: ${response.statusText}`,
      });
    }

    const githubUser = await response.json();

    return {
      login: githubUser.login,
      id: githubUser.id,
      avatarUrl: githubUser.avatar_url,
      name: githubUser.name,
      company: githubUser.company,
      blog: githubUser.blog,
      location: githubUser.location,
      email: githubUser.email,
      bio: githubUser.bio,
      publicRepos: githubUser.public_repos,
      publicGists: githubUser.public_gists,
      followers: githubUser.followers,
      following: githubUser.following,
      createdAt: githubUser.created_at,
      updatedAt: githubUser.updated_at,
      htmlUrl: githubUser.html_url,
    };
  }),
});
