import { createTRPCRouter, publicProcedure } from '../trpc';
import { getActiveDriver } from '../driver/utils';
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
});
