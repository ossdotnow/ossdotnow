import {
  GitManager,
  RepoData,
  ContributorData,
  IssueData,
  PullRequestData,
  GitManagerConfig,
} from './types';
import { restEndpointMethods } from '@octokit/plugin-rest-endpoint-methods';
import { Octokit } from '@octokit/core';

const MyOctokit = Octokit.plugin(restEndpointMethods);

export class GithubManager implements GitManager {
  private octokit: InstanceType<typeof MyOctokit>;

  constructor(config: GitManagerConfig) {
    this.octokit = new MyOctokit({ auth: config.token });
  }

  private parseRepoIdentifier(identifier: string): { owner: string; repo: string } {
    const [owner, repo] = identifier.split('/');
    if (!owner || !repo) {
      throw new Error('Invalid repository format. Use: username/repository');
    }
    return { owner, repo };
  }

  async getRepo(identifier: string): Promise<RepoData> {
    const { owner, repo } = this.parseRepoIdentifier(identifier);
    const { data } = await this.octokit.rest.repos.get({ owner, repo });
    return {
      ...data,
      id: data.id,
      name: data.name,
      description: data.description ?? undefined,
      url: data.html_url,
    };
  }

  async getContributors(identifier: string): Promise<ContributorData[]> {
    const { owner, repo } = this.parseRepoIdentifier(identifier);
    const { data } = await this.octokit.rest.repos.listContributors({ owner, repo });
    return data.map((c) => ({
      ...c,
      id: c.id!,
      username: c.login!,
      avatarUrl: c.avatar_url,
    }));
  }

  async getIssues(identifier: string): Promise<IssueData[]> {
    const { owner, repo } = this.parseRepoIdentifier(identifier);
    const { data } = await this.octokit.rest.issues.listForRepo({
      owner,
      repo,
      state: 'all',
      per_page: 100,
    });
    return data.map((i) => ({
      ...i,
      id: i.id,
      title: i.title,
      state: i.state,
      url: i.html_url,
    }));
  }

  async getPullRequests(identifier: string): Promise<PullRequestData[]> {
    const { owner, repo } = this.parseRepoIdentifier(identifier);
    const { data } = await this.octokit.rest.pulls.list({
      owner,
      repo,
      state: 'all',
      per_page: 100,
    });
    return data.map((p) => ({
      ...p,
      id: p.id,
      title: p.title,
      state: p.state,
      url: p.html_url,
    }));
  }

  async getRepoData(identifier: string) {
    const { owner, repo } = this.parseRepoIdentifier(identifier);

    const [repoData, contributors, issues, pullRequests] = await Promise.all([
      this.getRepo(identifier),
      this.getContributors(identifier),
      this.getIssues(identifier),
      this.getPullRequests(identifier),
    ]);

    return {
      repo: repoData,
      contributors,
      issues,
      pullRequests,
    };
  }
}
