import { createTRPCRouter, publicProcedure } from '../trpc';
import { getActiveDriver } from '../driver/utils';
import { z } from 'zod';

export const repositoryRouter = createTRPCRouter({
  getRepo: publicProcedure
    .input(
      z.object({
        url: z.string(),
        provider: z.enum(['github', 'gitlab']),
      }),
    )
    .query(async ({ input, ctx }) => {
      const driver = await getActiveDriver(input.provider, ctx);
      return driver.getRepo(input.url);
    }),

  getContributors: publicProcedure
    .input(
      z.object({
        url: z.string(),
        provider: z.enum(['github', 'gitlab']),
      }),
    )
    .query(async ({ input, ctx }) => {
      const driver = await getActiveDriver(input.provider, ctx);
      return driver.getContributors(input.url);
    }),

  getIssues: publicProcedure
    .input(
      z.object({
        url: z.string(),
        provider: z.enum(['github', 'gitlab']),
      }),
    )
    .query(async ({ input, ctx }) => {
      const driver = await getActiveDriver(input.provider, ctx);
      return driver.getIssues(input.url);
    }),

  getPullRequests: publicProcedure
    .input(
      z.object({
        url: z.string(),
        provider: z.enum(['github', 'gitlab']),
      }),
    )
    .query(async ({ input, ctx }) => {
      const driver = await getActiveDriver(input.provider, ctx);
      return driver.getPullRequests(input.url);
    }),

  getRepoData: publicProcedure
    .input(
      z.object({
        url: z.string(),
        provider: z.enum(['github', 'gitlab']),
      }),
    )
    .query(async ({ input, ctx }) => {
      const driver = await getActiveDriver(input.provider, ctx);
      return driver.getRepoData(input.url);
    }),
});
