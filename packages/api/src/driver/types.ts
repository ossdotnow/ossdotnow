import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';
import { project } from '@workspace/db/schema';

export interface RepoData {
  id: string | number;
  name: string;
  description?: string;
  url: string;
  [key: string]: any;
}

export interface ContributorData {
  id: string | number;
  username: string;
  avatarUrl?: string;
  [key: string]: any;
}

export interface IssueData {
  id: string | number;
  title: string;
  state: string;
  url: string;
  [key: string]: any;
}

export interface PullRequestData {
  id: string | number;
  title: string;
  state: string;
  url: string;
  [key: string]: any;
}

export type GitManagerConfig = {
  token: string;
};

export interface GitManager {
  getRepo(identifier: string): Promise<RepoData>;
  getContributors(identifier: string): Promise<ContributorData[]>;
  getIssues(identifier: string): Promise<IssueData[]>;
  getPullRequests(identifier: string): Promise<PullRequestData[]>;
  getRepoData(identifier: string): Promise<{
    repo: RepoData;
    contributors: ContributorData[];
    issues: IssueData[];
    pullRequests: PullRequestData[];
  }>;
  verifyOwnership(
    identifier: string,
    ctx: any,
    projectId: string,
  ): Promise<{
    success: boolean;
    project: typeof project.$inferSelect;
    ownershipType: string;
    verifiedAs: string;
  }>;
  getRepoPermissions(
    identifier: string,
  ): Promise<
    RestEndpointMethodTypes['repos']['getCollaboratorPermissionLevel']['response']['data']
  >;
  getCurrentUser(): Promise<{
    id: string;
    username: string;
  }>;
  getOrgMembership(
    org: string,
    username: string,
  ): Promise<RestEndpointMethodTypes['orgs']['getMembershipForUser']['response']['data']>;
}
