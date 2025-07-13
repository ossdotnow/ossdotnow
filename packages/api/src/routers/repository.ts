import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import { getActiveDriver } from '../driver/utils';
import { invalidateCache } from '../utils/cache';
import { GitManager } from '../driver/types';
import { z } from 'zod';

type PromiseReturnType<T> = T extends (...args: any) => Promise<infer R> ? R : never;

const createRepositoryProcedure = <T extends keyof GitManager>(methodName: T) =>
  publicProcedure
    .input(z.object({ url: z.string(), provider: z.enum(['github', 'gitlab']) }))
    .query(async ({ input, ctx }) => {
      const driver = await getActiveDriver(input.provider, ctx);
      const output = await (driver[methodName] as any)(input.url);

      return output as PromiseReturnType<GitManager[T]>;
    });

export const repositoryRouter = createTRPCRouter({
  getRepo: createRepositoryProcedure('getRepo'),
  getContributors: createRepositoryProcedure('getContributors'),
  getIssues: createRepositoryProcedure('getIssues'),
  getPullRequests: createRepositoryProcedure('getPullRequests'),
  getRepoData: createRepositoryProcedure('getRepoData'),

  invalidateCache: protectedProcedure
    .input(
      z.object({
        provider: z.enum(['github', 'gitlab']),
        identifier: z.string().optional(),
        type: z.enum(['repo', 'contributors', 'issues', 'pulls', 'user', 'all']).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      let pattern = input.provider;

      if (input.type && input.type !== 'all') {
        pattern += `:${input.type}`;
      }

      if (input.identifier) {
        pattern += `:${input.identifier}`;
      }

      await invalidateCache(pattern);

      return { success: true, pattern };
    }),
});
