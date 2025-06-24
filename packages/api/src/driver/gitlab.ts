import {
  ContributorData,
  GitManager,
  GitManagerConfig,
  IssueData,
  PullRequestData,
  RepoData,
} from './types';
import { Gitlab } from '@gitbeaker/rest';

export class GitlabManager implements GitManager {
  private gitlab: InstanceType<typeof Gitlab>;

  constructor(config: GitManagerConfig) {
    this.gitlab = new Gitlab({ token: config.token });
  }

  private parseIdentifier(identifier: string): { owner: string; project: string } {
    const [owner, project] = identifier.split('/');
    if (!owner || !project) {
      throw new Error('Invalid project path. Use: owner/project');
    }
    return { owner, project };
  }

  async getRepo(identifier: string): Promise<RepoData> {
    this.parseIdentifier(identifier); // For validation
    const projectData = await this.gitlab.Projects.show(identifier);
    return {
      ...projectData,
      id: projectData.id,
      name: projectData.name,
      description: projectData.description ?? undefined,
      url: projectData.web_url as string,
    };
  }

  async getContributors(identifier: string): Promise<ContributorData[]> {
    this.parseIdentifier(identifier);
    const members = await this.gitlab.ProjectMembers.all(identifier);
    return members.map((m: any) => ({
      ...m,
      id: m.id,
      username: m.username,
      avatarUrl: m.avatar_url,
    }));
  }

  async getIssues(identifier: string): Promise<IssueData[]> {
    this.parseIdentifier(identifier);
    const issues = await this.gitlab.Issues.all({
      projectId: identifier,
      state: 'all',
      perPage: 100,
    });
    return issues.map((i: any) => ({
      ...i,
      id: i.id,
      title: i.title,
      state: i.state,
      url: i.web_url,
    }));
  }

  async getPullRequests(identifier: string): Promise<PullRequestData[]> {
    this.parseIdentifier(identifier);
    const mergeRequests = await this.gitlab.MergeRequests.all({
      projectId: identifier,
      state: 'opened',
      perPage: 100,
    });
    return mergeRequests.map((mr: any) => ({
      ...mr,
      id: mr.id,
      title: mr.title,
      state: mr.state,
      url: mr.web_url,
    }));
  }

  async getRepoData(identifier: string) {
    this.parseIdentifier(identifier);
    const [repo, contributors, issues, pullRequests] = await Promise.all([
      this.getRepo(identifier),
      this.getContributors(identifier),
      this.getIssues(identifier),
      this.getPullRequests(identifier),
    ]);

    return {
      repo,
      contributors,
      issues,
      pullRequests,
    };
  }
}
