import { restEndpointMethods } from '@octokit/plugin-rest-endpoint-methods';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { account } from '@workspace/db/schema';
import { env } from '@workspace/env/server';
import { Octokit } from '@octokit/core';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod/v4';

export async function createOctokitInstance(ctx: any) {
  const MyOctokit = Octokit.plugin(restEndpointMethods);

  if (ctx.user?.id) {
    const userAccount = await ctx.db
      .select({ accessToken: account.accessToken })
      .from(account)
      .where(and(eq(account.userId, ctx.user.id), eq(account.providerId, 'github')))
      .limit(1);

    if (userAccount[0]?.accessToken) {
      return new MyOctokit({ auth: userAccount[0].accessToken });
    }
  }

  return new MyOctokit({ auth: env.GITHUB_TOKEN });
}

export const githubRouter = createTRPCRouter({
  getRepo: publicProcedure.input(z.object({ repo: z.string() })).query(async ({ input, ctx }) => {
    const [owner, repo] = input.repo.split('/');

    if (!owner || !repo) {
      throw new Error('Invalid repository format. Use: username/repository');
    }

    const github = await createOctokitInstance(ctx);

    const repoData = await github.rest.repos.get({
      owner,
      repo,
    });

    return repoData.data;
  }),
  getContributors: publicProcedure
    .input(z.object({ repo: z.string() }))
    .query(async ({ input, ctx }) => {
      const [owner, repo] = input.repo.split('/');

      if (!owner || !repo) {
        throw new Error('Invalid repository format. Use: username/repository');
      }

      const github = await createOctokitInstance(ctx);

      const contributors = await github.rest.repos.listContributors({
        owner,
        repo,
      });

      return contributors.data;
    }),

  getIssues: publicProcedure.input(z.object({ repo: z.string() })).query(async ({ input, ctx }) => {
    const [owner, repo] = input.repo.split('/');

    if (!owner || !repo) {
      throw new Error('Invalid repository format. Use: username/repository');
    }

    const github = await createOctokitInstance(ctx);

    const issues = await github.rest.issues.listForRepo({
      owner,
      repo,
      state: 'all',
      per_page: 100,
    });

    return issues.data;
  }),
  getPullRequests: publicProcedure
    .input(z.object({ repo: z.string() }))
    .query(async ({ input, ctx }) => {
      const [owner, repo] = input.repo.split('/');

      if (!owner || !repo) {
        throw new Error('Invalid repository format. Use: username/repository');
      }

      const github = await createOctokitInstance(ctx);

      const pullRequests = await github.rest.pulls.list({
        owner,
        repo,
        state: 'all',
        per_page: 100,
      });

      return pullRequests.data;
    }),

  // Batched endpoint that combines all GitHub API calls
  getRepoData: publicProcedure
    .input(z.object({ repo: z.string() }))
    .query(async ({ input, ctx }) => {
      const [owner, repo] = input.repo.split('/');

      if (!owner || !repo) {
        throw new Error('Invalid repository format. Use: username/repository');
      }

      const github = await createOctokitInstance(ctx);

      const [repoData, contributors, issues, pullRequests] = await Promise.all([
        github.rest.repos.get({ owner, repo }),
        github.rest.repos.listContributors({ owner, repo }),
        github.rest.issues.listForRepo({ owner, repo, state: 'all', per_page: 100 }),
        github.rest.pulls.list({ owner, repo, state: 'all', per_page: 100 }),
      ]);

      return {
        repo: repoData.data,
        contributors: contributors.data,
        issues: issues.data,
        pullRequests: pullRequests.data,
      };
    }),
});
