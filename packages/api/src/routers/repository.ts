import { createTRPCRouter, publicProcedure } from '../trpc';
import { getActiveDriver } from '../driver/utils';
import { GitManager } from '../driver/types';
import { unstable_cache } from 'next/cache';
import { z } from 'zod';

type PromiseReturnType<T> = T extends (...args: any) => Promise<infer R> ? R : never;

const createRepositoryProcedure = <T extends keyof GitManager>(methodName: T) => {
  return publicProcedure
    .input(z.object({ url: z.string(), provider: z.enum(['github', 'gitlab']) }))
    .query(async ({ input }) => {
      const cached = unstable_cache(
        async (provider: 'github' | 'gitlab', url: string) => {
          const driver = await getActiveDriver(provider);
          const result = await (driver[methodName] as any)(url);
          return result as PromiseReturnType<GitManager[T]>;
        },
        ['repository', `repository.${input.provider}`, `repository.${input.provider}.${input.url}`],
        { revalidate: 60 * 5 }, // 5 minutes
      );

      return cached(input.provider, input.url);
    });
};

export const repositoryRouter = createTRPCRouter({
  getRepo: createRepositoryProcedure('getRepo'),
  getContributors: createRepositoryProcedure('getContributors'),
  getIssues: createRepositoryProcedure('getIssues'),
  getPullRequests: createRepositoryProcedure('getPullRequests'),
  getRepoData: createRepositoryProcedure('getRepoData'),
});
