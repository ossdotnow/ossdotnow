import { createTRPCRouter, publicProcedure } from '../trpc';
import { env } from '@workspace/env/server';
import { Gitlab } from '@gitbeaker/rest';
import { z } from 'zod/v4';

export async function createGitlabInstance() {
  return new Gitlab({
    token: env.GITLAB_TOKEN,
  });
}

export const gitlabRouter = createTRPCRouter({
  getProject: publicProcedure
    .input(
      z.object({
        projectPath: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const [owner, project] = input.projectPath.split('/');

      if (!owner || !project) {
        throw new Error('Invalid project path. Use: owner/project');
      }

      const gitlab = await createGitlabInstance();

      const projectData = await gitlab.Projects.show(input.projectPath);

      return projectData;
    }),
  getMembers: publicProcedure
    .input(
      z.object({
        projectPath: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const [owner, project] = input.projectPath.split('/');

      if (!owner || !project) {
        throw new Error('Invalid repository format. Use owner/project');
      }

      const gitlab = await createGitlabInstance();

      const members = await gitlab.ProjectMembers.all(input.projectPath);

      return members;
    }),
  getIssues: publicProcedure
    .input(z.object({ projectPath: z.string() }))
    .query(async ({ input }) => {
      const [owner, project] = input.projectPath.split('/');

      if (!owner || !project) {
        throw new Error('Invalid repository format. Use owner/project');
      }

      const gitlab = await createGitlabInstance();

      const issues = await gitlab.Issues.all({
        projectId: input.projectPath,
        state: 'all',
        per_page: 100,
      });

      return issues;
    }),
  getMergeRequests: publicProcedure
    .input(z.object({ projectPath: z.string() }))
    .query(async ({ input }) => {
      const [owner, project] = input.projectPath.split('/');

      if (!owner || !project) {
        throw new Error('Invalid repository format. Use owner/project');
      }

      const gitlab = await createGitlabInstance();

      const mergeRequests = await gitlab.MergeRequests.all({
        projectId: input.projectPath,
        state: 'opened',
        per_page: 100,
      });

      return mergeRequests;
    }),

  //batched endpoint that combines all gitlab API calls
  getProjectData: publicProcedure
    .input(z.object({ projectPath: z.string() }))
    .query(async ({ input }) => {
      const [owner, project] = input.projectPath.split('/');

      if (!owner || !project) {
        throw new Error('Invalid repository format. Use owner/project');
      }

      const gitlab = await createGitlabInstance();

      const [projectData, members, issues, mergeRequests] = await Promise.all([
        gitlab.Projects.show(input.projectPath),
        gitlab.ProjectMembers.all(input.projectPath),
        gitlab.Issues.all({
          projectId: input.projectPath,
          state: 'all',
          per_page: 100,
        }),
        gitlab.MergeRequests.all({
          projectId: input.projectPath,
          state: 'opened',
          per_page: 100,
        }),
      ]);

      return {
        projectData,
        members,
        issues,
        mergeRequests,
      };
    }),
});
