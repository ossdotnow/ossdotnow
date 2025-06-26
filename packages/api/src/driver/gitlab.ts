import {
  ContributorData,
  GitManager,
  GitManagerConfig,
  IssueData,
  PullRequestData,
  RepoData,
} from './types';
import { project } from '@workspace/db/schema';
import { Gitlab } from '@gitbeaker/rest';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';

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
    const { owner, repo } = this.parseRepoIdentifier(identifier);
    console.log('owner', owner);
    console.log('repo', repo);
    try {
      const projectData = await this.gitlab.Projects.show((identifier));

      console.log('projectData', projectData);

      return {
        ...projectData,
        id: projectData.id,
        name: projectData.name,
        description: projectData.description ?? undefined,
        url: projectData.web_url as string,
      };
    } catch (error) {
      console.error('Error fetching repository:', error);
      throw new Error(
        `Failed to fetch repository ${identifier}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
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
    const members = await this.gitlab.ProjectMembers.all(identifier);
    return members.map((m: any) => ({
      ...m,
      id: m.id,
      username: m.username,
      avatarUrl: m.avatar_url,
    }));
  }

  async getIssues(identifier: string): Promise<IssueData[]> {
    this.parseRepoIdentifier(identifier);
    const issues = await this.gitlab.Issues.all({
      projectId: identifier,
      state: 'opened',
      perPage: 100,
    });
    return issues.map((i: any) => ({
      id: i.id,
      title: i.title,
      state: i.state,
      url: i.web_url,
      ...i,
    }));
  }

  async getPullRequests(identifier: string): Promise<PullRequestData[]> {
    this.parseRepoIdentifier(identifier);
    const mergeRequests = await this.gitlab.MergeRequests.all({
      projectId: identifier,
      state: 'opened',
      perPage: 100,
    });
    return mergeRequests.map((mr: any) => ({
      id: mr.id,
      title: mr.title,
      state: mr.state,
      url: mr.web_url,
      ...mr,
    }));
  }

  async getRepoData(identifier: string) {
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

  async verifyOwnership(
    identifier: string,
    ctx: any,
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
      } catch (error: unknown) {
        console.log(
          'User does not have collaborator access to the repository:',
          (error as Error).message,
        );
      }
    }

    if (!isOwner) {
      console.log(`Claim denied for user ${currentUser.username} on repo ${owner}/${repo}`);
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `You don't have the required permissions to claim this project. You must be either the repository owner or an organization owner. Current user: ${currentUser.username}, Repository owner: ${repoData.owner.login}`,
      });
    }

    console.log(`Claim approved: ${currentUser.username} is ${ownershipType} for ${owner}/${repo}`);

    const updatedProject = await ctx.db
      .update(project)
      .set({
        ownerId: ctx.session.userId,
        updatedAt: new Date(),
      })
      .where(eq(project.id, projectId))
      .returning();

    if (!updatedProject[0]) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update project ownership',
      });
    }

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
      const user = users.find((u: any) => u.username === username);

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
}
