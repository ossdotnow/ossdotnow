import {
  ContributionData,
  ContributorData,
  GitManager,
  GitManagerConfig,
  IssueData,
  PullRequestData,
  ReadmeData,
  ContributingData,
  CodeOfConductData,
  FileData,
  RepoData,
  UserData,
  UserPullRequestData,
} from './types';
import { project, projectClaim } from '@workspace/db/schema';
import { getCached, createCacheKey } from '../utils/cache';
import { eq, and, isNull } from 'drizzle-orm';
import { Gitlab } from '@gitbeaker/rest';
import { TRPCError } from '@trpc/server';
import { type Context } from './utils';

export class GitlabManager implements GitManager {
  private gitlab: InstanceType<typeof Gitlab>;

  constructor(config: GitManagerConfig) {
    // check if a user is logged in: if they are use authToken otherwise use token
    this.gitlab = new Gitlab({
      oauthToken: config.token,
      token: config.token,
      host: 'https://gitlab.com',
    });
  }

  private parseRepoIdentifier(identifier: string): { owner: string; repo: string } {
    const [owner, repo] = identifier.split('/');
    if (!owner || !repo) {
      throw new Error('Invalid project path. Use: owner/repo');
    }
    return { owner, repo };
  }

  async getCurrentUser(): Promise<{
    id: string;
    username: string;
  }> {
    const user = await this.gitlab.Users.showCurrentUser();
    return {
      id: user.id.toString(),
      username: user.username,
    };
  }

  async getRepo(identifier: string): Promise<RepoData> {
    this.parseRepoIdentifier(identifier);

    return getCached(
      createCacheKey('gitlab', 'repo', identifier),
      async () => {
        try {
          const projectData = await this.gitlab.Projects.show(identifier);

          const isPrivate =
            projectData.visibility === 'private' || projectData.visibility === 'internal';

          return {
            ...projectData,
            id: projectData.id,
            name: projectData.name,
            description: projectData.description ?? undefined,
            url: projectData.web_url as string,
            isPrivate,
          };
        } catch (error) {
          if (error instanceof TRPCError) {
            throw error;
          }
          console.error('Error fetching repository:', error);
          throw new Error(
            `Failed to fetch repository ${identifier}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      },
      { ttl: 5 * 60 },
    );
  }

  async getRepoPermissions(identifier: string): Promise<any> {
    const currentUser = await this.getCurrentUser();

    try {
      // Get the project with the current user's permissions
      const projectData = await this.gitlab.Projects.show(identifier);

      // Try to get the member directly
      const member = await this.gitlab.ProjectMembers.show(identifier, parseInt(currentUser.id));

      // GitLab access levels: 10=Guest, 20=Reporter, 30=Developer, 40=Maintainer, 50=Owner
      const accessLevelMap: { [key: number]: string } = {
        10: 'guest',
        20: 'reporter',
        30: 'developer',
        40: 'maintainer',
        50: 'owner',
      };

      return {
        permission: accessLevelMap[(member as any).access_level] || 'none',
        access_level: (member as any).access_level,
        user: {
          login: currentUser.username,
          permissions: (projectData as any).permissions || {},
        },
      };
    } catch (error) {
      // If user is not a direct member, check if they have access through the project
      const projectData = await this.gitlab.Projects.show(identifier);

      // Check permissions object if available
      if ((projectData as any).permissions) {
        const permissions = (projectData as any).permissions;
        const level =
          permissions.project_access?.access_level || permissions.group_access?.access_level || 0;

        const accessLevelMap: { [key: number]: string } = {
          10: 'guest',
          20: 'reporter',
          30: 'developer',
          40: 'maintainer',
          50: 'owner',
        };

        return {
          permission: accessLevelMap[level] || 'none',
          access_level: level,
          user: {
            login: currentUser.username,
            permissions: (projectData as any).permissions,
          },
        };
      }

      throw error;
    }
  }

  async getContributors(identifier: string): Promise<ContributorData[]> {
    this.parseRepoIdentifier(identifier);

    return getCached(
      createCacheKey('gitlab', 'contributors', identifier),
      async () => {
        const members = await this.gitlab.ProjectMembers.all(identifier, {
          perPage: 100,
          maxPages: 50,
        });

        return members.map((m: any) => ({
          ...m,
          id: m.id,
          username: m.username,
          avatarUrl: m.avatar_url,
        }));
      },
      { ttl: 60 * 60 },
    );
  }

  async getIssues(identifier: string): Promise<IssueData[]> {
    this.parseRepoIdentifier(identifier);

    return getCached(
      createCacheKey('gitlab', 'issues', identifier),
      async () => {
        try {
          // GitLab API doesn't support 'all' as a state, lol
          const openIssues = await this.gitlab.Issues.all({
            projectId: identifier,
            state: 'opened',
            perPage: 100,
          });

          const closedIssues = await this.gitlab.Issues.all({
            projectId: identifier,
            state: 'closed',
            perPage: 100,
          });

          const issues = [...openIssues, ...closedIssues];
          return issues.map((i: any) => ({
            id: i.id,
            title: i.title,
            state: i.state === 'opened' ? 'open' : i.state, // to match github format
            url: i.web_url,
            number: i.iid, // adding to match github format
            pull_request: null, // adding to match github format
            user: {
              login: i.author?.username,
            },
            ...i,
          }));
        } catch (error) {
          console.error('Error fetching GitLab issues:', error);
          return [];
        }
      },
      { ttl: 10 * 60 },
    );
  }

  async getPullRequests(identifier: string): Promise<PullRequestData[]> {
    this.parseRepoIdentifier(identifier);

    return getCached(
      createCacheKey('gitlab', 'pulls', identifier),
      async () => {
        try {
          // GitLab API doesn't support 'all' as a state
          const openMRs = await this.gitlab.MergeRequests.all({
            projectId: identifier,
            state: 'opened',
            perPage: 100,
          });

          const closedMRs = await this.gitlab.MergeRequests.all({
            projectId: identifier,
            state: 'closed',
            perPage: 100,
          });

          const mergedMRs = await this.gitlab.MergeRequests.all({
            projectId: identifier,
            state: 'merged',
            perPage: 100,
          });

          const mergeRequests = [...openMRs, ...closedMRs, ...mergedMRs];
          return mergeRequests.map((mr: any) => ({
            id: mr.id,
            title: mr.title,
            state: mr.state === 'opened' ? 'open' : mr.state, // same
            url: mr.web_url,
            merged_at: mr.merged_at || null, // same
            number: mr.iid, // same
            user: {
              login: mr.author?.username,
            },
            draft: mr.work_in_progress || false, // same
            ...mr,
          }));
        } catch (error) {
          console.error('Error fetching GitLab pull requests:', error);
          return [];
        }
      },
      { ttl: 10 * 60 },
    );
  }

  async getIssuesCount(identifier: string): Promise<number> {
    this.parseRepoIdentifier(identifier);

    return getCached(
      createCacheKey('gitlab', 'open_issues_count', identifier),
      async () => {
        try {
          // Getting only open issues count
          const issues = await this.gitlab.Issues.all({
            projectId: identifier,
            state: 'opened',
            perPage: 1,
          });

          // GitLab API doesn't provide pagination info directly on the array
          // We need to check if the response has pagination metadata
          // @ts-ignore - The GitLab API types don't include the pagination property
          const paginationInfo = issues.pagination || (issues as any)._paginationInfo;
          return paginationInfo?.total || issues.length || 0;
        } catch (error) {
          console.error('Error fetching GitLab issues count:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to retrieve issues count for this GitLab repository',
          });
        }
      },
      { ttl: 10 * 60 },
    );
  }

  async getPullRequestsCount(identifier: string): Promise<number> {
    this.parseRepoIdentifier(identifier);

    return getCached(
      createCacheKey('gitlab', 'open_pull_requests_count', identifier),
      async () => {
        try {
          const mergeRequests = await this.gitlab.MergeRequests.all({
            projectId: identifier,
            state: 'opened',
            perPage: 1,
          });

          // GitLab API doesn't provide pagination info directly on the array
          // We need to check if the response has pagination metadata
          // @ts-ignore - The GitLab API types don't include the pagination property
          const paginationInfo = mergeRequests.pagination || (mergeRequests as any)._paginationInfo;
          return paginationInfo?.total || mergeRequests.length || 0;
        } catch (error) {
          console.error('Error fetching GitLab pull requests count:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to retrieve pull requests count for this GitLab repository',
          });
        }
      },
      { ttl: 10 * 60 }, // Cache for 10 minutes as per requirements
    );
  }

  private async fetchRepositoryFile(
    identifier: string,
    cacheType: string,
    possibleFilenames: string[],
    errorMessage: string,
  ): Promise<FileData> {
    this.parseRepoIdentifier(identifier);

    return getCached(
      createCacheKey('gitlab', cacheType, identifier),
      async () => {
        try {
          // Get project info first to find the default branch
          const project = await this.gitlab.Projects.show(identifier);
          const defaultBranch = project.default_branch || 'main';
          let file = null;
          let fileName = '';
          // Try to find the file
          for (const filename of possibleFilenames) {
            try {
              file = await this.gitlab.RepositoryFiles.show(
                identifier,
                filename,
                defaultBranch as string,
              );
              fileName = filename;
              break;
            } catch (error) {
              // Continue to next filename if this one doesn't exist
            }
          }
          if (!file) {
            throw new Error(`No ${cacheType} file found`);
          }
          return {
            content: file.content,
            encoding: file.encoding as 'base64' | 'utf8',
            name: fileName,
            path: fileName,
            size: file.size,
            download_url: undefined,
            html_url: `${project.web_url}/-/blob/${defaultBranch}/${fileName}`,
          };
        } catch (error) {
          console.error(`Error fetching GitLab ${cacheType}:`, error);
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: errorMessage,
          });
        }
      },
      { ttl: 60 * 60 },
    );
  }

  async getReadme(identifier: string): Promise<ReadmeData> {
    const readmeFiles = [
      'README.md',
      'README.rst',
      'README.txt',
      'README',
      'readme.md',
      'readme.rst',
      'readme.txt',
      'readme',
    ];
    return this.fetchRepositoryFile(
      identifier,
      'readme',
      readmeFiles,
      'README not found for this GitLab project',
    );
  }

  async getContributing(identifier: string): Promise<ContributingData> {
    const contributingFiles = [
      'CONTRIBUTING.md',
      'CONTRIBUTING.rst',
      'CONTRIBUTING.txt',
      'CONTRIBUTING',
      'contributing.md',
      'contributing.rst',
      'contributing.txt',
      'contributing',
      '.gitlab/CONTRIBUTING.md',
      'docs/CONTRIBUTING.md',
    ];
    return this.fetchRepositoryFile(
      identifier,
      'contributing',
      contributingFiles,
      'Contributing guidelines not found for this GitLab project',
    );
  }

  async getCodeOfConduct(identifier: string): Promise<CodeOfConductData> {
    const cocFiles = [
      'CODE_OF_CONDUCT.md',
      'CODE_OF_CONDUCT.rst',
      'CODE_OF_CONDUCT.txt',
      'CODE_OF_CONDUCT',
      'code_of_conduct.md',
      'code_of_conduct.rst',
      'code_of_conduct.txt',
      'code_of_conduct',
      'COC.md',
      'COC.rst',
      'COC.txt',
      'COC',
      'coc.md',
      'coc.rst',
      'coc.txt',
      'coc',
      '.gitlab/CODE_OF_CONDUCT.md',
      '.gitlab/COC.md',
      'docs/CODE_OF_CONDUCT.md',
      'docs/COC.md',
    ];
    return this.fetchRepositoryFile(
      identifier,
      'codeofconduct',
      cocFiles,
      'Code of conduct not found for this GitLab project',
    );
  }

  async getRepoData(identifier: string) {
    const [repo, contributors, issuesCount, pullRequestsCount] = await Promise.all([
      this.getRepo(identifier),
      this.getContributors(identifier),
      this.getIssuesCount(identifier),
      this.getPullRequestsCount(identifier),
    ]);

    return {
      repo,
      contributors,
      issuesCount,
      pullRequestsCount,
    };
  }

  async verifyOwnership(
    identifier: string,
    ctx: Context,
    projectId: string,
  ): Promise<{
    success: boolean;
    project: typeof project.$inferSelect;
    ownershipType: string;
    verifiedAs: string;
  }> {
    const { owner, repo } = this.parseRepoIdentifier(identifier);

    const currentUser = await this.getCurrentUser();

    const repoData = await this.getRepo(identifier);

    let isOwner = false;
    let ownershipType = '';

    if (repoData.owner.login === currentUser.username) {
      isOwner = true;
      ownershipType = 'repository owner';
    } else if (repoData.owner.type === 'Organization') {
      console.log(
        `Checking org ownership for ${currentUser.username} in org ${repoData.owner.login}`,
      );

      try {
        const repoPermissions = await this.getRepoPermissions(identifier);

        // In GitLab, access level 40 (Maintainer) or 50 (Owner) gives admin permissions
        if (repoPermissions.access_level >= 40) {
          isOwner = true;
          ownershipType =
            repoPermissions.access_level === 50 ? 'project owner' : 'project maintainer';
        } else {
          // Check if the project belongs to a group and if user has owner access to that group
          try {
            const projectData = await this.getRepo(identifier);

            if (projectData.namespace?.kind === 'group') {
              const groupMembership = await this.getOrgMembership(
                projectData.namespace.full_path,
                currentUser.username,
              );

              // In GitLab, access level 50 means Owner
              if (groupMembership.access_level >= 50) {
                isOwner = true;
                ownershipType = 'group owner';
              }
            }
          } catch (orgError) {
            console.log('User is not a member of the group or group check failed:', orgError);
          }
        }
      } catch (error) {
        console.log(
          'User does not have collaborator access to the repository:',
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    if (!isOwner) {
      console.log(`Claim denied for user ${currentUser.username} on repo ${owner}/${repo}`);
      await ctx.db.insert(projectClaim).values({
        projectId,
        userId: ctx.session!.userId,
        success: false,
        verificationMethod: 'gitlab_api',
        verificationDetails: {
          verifiedAs: currentUser.username,
          repoOwner: repoData.owner.login,
          repoOwnerType: repoData.owner.type,
          reason: 'insufficient_permissions',
        },
        errorReason: `User ${currentUser.username} does not have required permissions. Repository owner: ${repoData.owner.login}`,
      });

      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `You don't have the required permissions to claim this project. You must be either the repository owner or an organization owner. Current user: ${currentUser.username}, Repository owner: ${repoData.owner.login}`,
      });
    }

    console.log(`Claim approved: ${currentUser.username} is ${ownershipType} for ${owner}/${repo}`);

    const updatedProject = await ctx.db
      .update(project)
      .set({
        ownerId: ctx.session?.userId ?? null,
        updatedAt: new Date(),
      })
      .where(and(eq(project.id, projectId), isNull(project.ownerId)))
      .returning();

    if (!updatedProject[0]) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Project has already been claimed by another user',
      });
    }
    await ctx.db.insert(projectClaim).values({
      projectId,
      userId: ctx.session!.userId,
      success: true,
      verificationMethod: ownershipType,
      verificationDetails: {
        verifiedAs: currentUser.username,
        repoOwner: repoData.owner.login,
        repoOwnerType: repoData.owner.type,
        ownershipType,
        repositoryUrl: `https://gitlab.com/${owner}/${repo}`,
      },
    });

    // Create a notification or send an email to inform about the claim
    // This would require implementing a notification system
    // Example: await createNotification({
    //   type: 'project_claimed',
    //   projectId: input.projectId,
    //   newOwnerId: ctx.session.userId,
    // });

    return {
      success: true,
      project: updatedProject[0],
      ownershipType,
      verifiedAs: currentUser.username,
    };
  }

  async getOrgMembership(org: string, username: string): Promise<any> {
    try {
      // In GitLab, organizations are called "Groups"
      // First, get the user ID from username
      const users = await this.gitlab.Users.all({ username });
      const user = users.find(
        (u: any) => u.username === username || u.username.toLowerCase() === username.toLowerCase(),
      );

      if (!user) {
        throw new Error('User not found');
      }

      // Get the member details from the group
      const member = await this.gitlab.GroupMembers.show(org, user.id);

      // Map GitLab access levels to roles
      const roleMap: { [key: number]: string } = {
        10: 'guest',
        20: 'reporter',
        30: 'developer',
        40: 'maintainer',
        50: 'owner',
      };

      return {
        role: roleMap[(member as any).access_level] || 'member',
        state: (member as any).state || 'active',
        access_level: (member as any).access_level,
        user: {
          login: username,
        },
      };
    } catch (error) {
      throw new Error(`User ${username} is not a member of group ${org}`);
    }
  }

  async getUserDetails(username: string): Promise<UserData> {
    return getCached(
      createCacheKey('gitlab', 'user', username),
      async () => {
        try {
          const users = await this.gitlab.Users.all({ username });

          if (!users || users.length === 0) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: `GitLab user '${username}' not found`,
            });
          }

          // Find exact match first, then case-insensitive match
          const user =
            users.find((u: any) => u.username === username) ||
            users.find((u: any) => u.username.toLowerCase() === username.toLowerCase()) ||
            users[0];

          const userDetails = await this.gitlab.Users.show(user!.id);

          return {
            provider: 'gitlab',
            login: userDetails.username,
            id: userDetails.id,
            avatarUrl: userDetails.avatar_url as string,
            name: userDetails.name ?? undefined,
            company: (userDetails as any).organization ?? undefined,
            blog: (userDetails.website_url as string) ?? undefined,
            location: (userDetails as any).location ?? undefined,
            email: (userDetails as any).public_email ?? undefined,
            bio: (userDetails as any).bio ?? undefined,
            publicRepos: (userDetails as any).projects?.length || 0,
            followers: (userDetails as any).followers || 0,
            following: (userDetails as any).following || 0,
            createdAt: userDetails.created_at as string,
            htmlUrl: userDetails.web_url as string,
          };
        } catch (error) {
          if (error instanceof TRPCError) {
            throw error;
          }
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to fetch GitLab user details: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      },
      { ttl: 30 * 60 },
    );
  }

  async getContributions(username: string): Promise<ContributionData> {
    return getCached(
      createCacheKey('gitlab', 'contributions', username),
      async () => {
        try {
          // GitLab doesn't provide a direct contributions API like GitHub
          // We could potentially fetch user's recent events or activity, but that's limited
          // For now, return empty contribution data
          console.warn(`GitLab contributions API not available for user: ${username}`);

          return {
            totalContributions: 0,
            days: [],
          };
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to fetch GitLab contributions: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      },
      { ttl: 60 * 60 },
    );
  }

  async getUserPullRequests(
    username: string,
    options?: {
      state?: 'open' | 'closed' | 'merged' | 'all';
      limit?: number;
    },
  ): Promise<UserPullRequestData[]> {
    const limit = options?.limit || 100;
    const stateFilter = options?.state || 'all';

    let stateParam: 'opened' | 'closed' | 'merged' | undefined;
    if (stateFilter === 'open') stateParam = 'opened';
    else if (stateFilter === 'closed') stateParam = 'closed';
    else if (stateFilter === 'merged') stateParam = 'merged';

    try {
      const users = await this.gitlab.Users.all({ username });
      const user = users.find(
        (u: any) => u.username === username || u.username.toLowerCase() === username.toLowerCase(),
      );

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `GitLab user '${username}' not found`,
        });
      }

      const mergeRequests = await this.gitlab.MergeRequests.all({
        authorId: user.id,
        perPage: limit,
        maxPages: Math.ceil(limit / 100),
        state: stateParam,
        orderBy: 'created_at',
        sort: 'desc',
      });

      return mergeRequests.map((mr: any) => {
        // Extract project path from web_url
        // GitLab URL format: https://gitlab.com/owner/repo/-/merge_requests/123
        const urlParts = mr.web_url.split('/-/merge_requests/');
        const projectUrl = urlParts[0] || '';
        const pathMatch = projectUrl.match(/gitlab\.com\/(.+)$/);
        const projectPath = pathMatch ? pathMatch[1] : '';

        // Extract owner from project path (owner/repo format)
        const [ownerLogin] = projectPath.split('/');

        return {
          id: mr.id.toString(),
          number: mr.iid,
          title: mr.title,
          state: mr.state === 'opened' ? 'open' : mr.state,
          url: mr.web_url,
          createdAt: mr.created_at,
          updatedAt: mr.updated_at,
          closedAt: mr.closed_at || undefined,
          mergedAt: mr.merged_at || undefined,
          isDraft: mr.draft || mr.work_in_progress || false,
          headRefName: mr.source_branch,
          baseRefName: mr.target_branch,
          repository: {
            nameWithOwner: projectPath || `${mr.author.username}/unknown`,
            url: projectUrl,
            isPrivate: undefined, // Cannot determine from MR data alone
            owner: {
              login: ownerLogin || mr.author.username,
            },
          },
        };
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch GitLab merge requests: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }
}
