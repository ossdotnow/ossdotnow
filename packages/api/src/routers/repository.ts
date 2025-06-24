import { createTRPCRouter, publicProcedure } from '../trpc';
import { getActiveDriver } from '../driver/utils';
import { getUrlParts } from '../utils/url';
import { z } from 'zod';

export const repositoryRouter = createTRPCRouter({
  getRepo: publicProcedure
    .input(
      z.object({
        url: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { provider, identifier } = getUrlParts(input.url);
      const driver = await getActiveDriver(ctx, provider);
      return driver.getRepo(identifier);
    }),

  getContributors: publicProcedure
    .input(
      z.object({
        url: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { provider, identifier } = getUrlParts(input.url);
      const driver = await getActiveDriver(ctx, provider);
      return driver.getContributors(identifier);
    }),

  getIssues: publicProcedure
    .input(
      z.object({
        url: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { provider, identifier } = getUrlParts(input.url);
      const driver = await getActiveDriver(ctx, provider);
      return driver.getIssues(identifier);
    }),

  getPullRequests: publicProcedure
    .input(
      z.object({
        url: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { provider, identifier } = getUrlParts(input.url);
      const driver = await getActiveDriver(ctx, provider);
      return driver.getPullRequests(identifier);
    }),

  getRepoData: publicProcedure
    .input(
      z.object({
        url: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { provider, identifier } = getUrlParts(input.url);
      const driver = await getActiveDriver(ctx, provider);
      return driver.getRepoData(identifier);
    }),
});
