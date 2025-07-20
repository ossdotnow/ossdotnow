'use client';

import {
  AlertCircle,
  Briefcase,
  Building,
  CheckCircle,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  GitFork,
  GitMerge,
  GitPullRequest,
  Heart,
  Star,
  Tag,
  Users,
  XCircle,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { ClaimProjectDialog } from '@/components/project/claim-project-dialog';
import { Separator } from '@workspace/ui/components/separator';
import { useQueries, useQuery } from '@tanstack/react-query';
import { projectProviderEnum } from '@workspace/db/schema';
import LoadingSpinner from '@/components/loading-spinner';
import ProjectDescription from './project-description';
import { ProjectWithRelations } from '@workspace/api';
import ProjectErrorPage from '../project-error-page';
import { MarkdownContent } from './markdown-content';
import { authClient } from '@workspace/auth/client';
import Link from '@workspace/ui/components/link';
import { useEffect, useState } from 'react';
import { useTRPC } from '@/hooks/use-trpc';
import { formatDate } from '@/lib/utils';

// Define types for repository data
interface RepoContent {
  content: string;
  encoding: 'base64' | 'utf8';
}

interface Label {
  id: string | number;
  name: string;
  color: string;
}

interface User {
  login?: string;
  username?: string;
}

interface Issue {
  id: string | number;
  number?: number;
  iid?: number;
  title: string;
  state: string;
  created_at: string;
  html_url?: string;
  web_url?: string;
  user?: User;
  author?: User;
  labels?: Array<Label | string>;
  pull_request?: unknown;
}

interface PullRequest {
  id: string | number;
  number?: number;
  iid?: number;
  title: string;
  state: string;
  created_at: string;
  merged_at?: string;
  html_url?: string;
  web_url?: string;
  user?: User;
  author?: User;
  labels?: Array<Label | string>;
  draft?: boolean;
}

interface Repository {
  html_url?: string;
  web_url?: string;
  stargazers_count?: number;
  star_count?: number;
  forks_count?: number;
  created_at?: string;
  updated_at?: string;
  id?: string;
  name?: string;
  url?: string;
}

interface RepoData {
  contributors?: Array<unknown>;
  issuesCount?: number;
  pullRequestsCount?: number;
}

interface Project {
  id: string;
  ownerId: string | null;
  logoUrl: string | null;
  gitRepoUrl: string | null;
  gitHost: string | null;
  name: string;
  description: string | null;
  socialLinks: {
    twitter?: string;
    discord?: string;
    linkedin?: string;
    website?: string;
    [key: string]: string | undefined;
  } | null;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  isPinned: boolean;
  hasBeenAcquired: boolean;
  isLookingForContributors: boolean;
  isLookingForInvestors: boolean;
  isHiring: boolean;
  isPublic: boolean;
  isRepoPrivate: boolean;
  acquiredBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  statusId: string;
  typeId: string;
  deletedAt: Date | null;
  status?: {
    id: string;
    name: string;
    displayName?: string;
  };
  type?: {
    id: string;
    name: string;
    displayName?: string;
  };
  tagRelations?: Array<{
    tag?: {
      id?: string;
      name: string;
      displayName?: string;
    };
  }>;
}

const isValidProvider = (
  provider: string | null | undefined,
): provider is (typeof projectProviderEnum.enumValues)[number] => {
  return provider === 'github' || provider === 'gitlab';
};

function useProject(id: string) {
  const trpc = useTRPC();
  const query = useQuery(trpc.projects.getProject.queryOptions({ id }, { retry: false }));

  return {
    project: query.data as ProjectWithRelations | undefined,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export default function ProjectPage({ id }: { id: string }) {
  const { project, isLoading: projectLoading, error: projectError } = useProject(id);
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const [showShadow, setShowShadow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowShadow(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const trpc = useTRPC();

  const repoQuery = useQuery(
    trpc.repository.getRepo.queryOptions(
      {
        url: project?.gitRepoUrl as string,
        provider: project?.gitHost as (typeof projectProviderEnum.enumValues)[number],
      },
      {
        enabled: !!project?.gitRepoUrl && isValidProvider(project?.gitHost),
        retry: false,
      },
    ),
  );

  const repoDataQuery = useQuery(
    trpc.repository.getRepoData.queryOptions(
      {
        url: project?.gitRepoUrl as string,
        provider: project?.gitHost as (typeof projectProviderEnum.enumValues)[number],
      },
      {
        enabled: !!repoQuery.data && !!project?.gitRepoUrl && isValidProvider(project?.gitHost),
        retry: false,
      },
    ),
  );

  const otherQueries = useQueries({
    queries: [
      trpc.repository.getIssues.queryOptions(
        {
          url: project?.gitRepoUrl as string,
          provider: project?.gitHost as (typeof projectProviderEnum.enumValues)[number],
        },
        {
          enabled: !!repoQuery.data && !!project?.gitRepoUrl && isValidProvider(project?.gitHost),
          retry: false,
        },
      ),
      trpc.repository.getPullRequests.queryOptions(
        {
          url: project?.gitRepoUrl as string,
          provider: project?.gitHost as (typeof projectProviderEnum.enumValues)[number],
        },
        {
          enabled: !!repoQuery.data && !!project?.gitRepoUrl && isValidProvider(project?.gitHost),
          retry: false,
        },
      ),
      trpc.repository.getReadme.queryOptions(
        {
          url: project?.gitRepoUrl as string,
          provider: project?.gitHost as (typeof projectProviderEnum.enumValues)[number],
        },
        {
          enabled: !!repoQuery.data && !!project?.gitRepoUrl && isValidProvider(project?.gitHost),
          retry: false,
        },
      ),
      trpc.repository.getContributing.queryOptions(
        {
          url: project?.gitRepoUrl as string,
          provider: project?.gitHost as (typeof projectProviderEnum.enumValues)[number],
        },
        {
          enabled: !!repoQuery.data && !!project?.gitRepoUrl && isValidProvider(project?.gitHost),
          retry: false,
        },
      ),
      trpc.repository.getCodeOfConduct.queryOptions(
        {
          url: project?.gitRepoUrl as string,
          provider: project?.gitHost as (typeof projectProviderEnum.enumValues)[number],
        },
        {
          enabled: !!repoQuery.data && !!project?.gitRepoUrl && isValidProvider(project?.gitHost),
          retry: false,
        },
      ),
    ],
  });

  if (projectLoading) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] w-full items-center justify-center px-4 sm:px-6 lg:px-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (projectError || !project) {
    return <ProjectErrorPage type="projectNotFound" />;
  }

  if (!project.gitRepoUrl) {
    return <ProjectErrorPage type="repoNotAvailable" />;
  }

  if (repoQuery.isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] w-full items-center justify-center px-4 sm:px-6 lg:px-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (repoQuery.error || !repoQuery.data) {
    return <ProjectErrorPage type="repoNotFound" onTryAgain={() => repoQuery.refetch()} />;
  }

  const isUnclaimed = !project.ownerId;
  const isOwner = user?.id === project.ownerId;
  const repoData = repoQuery.data as Repository;
  const repo = {
    ...repoData,
    id: repoData.html_url || repoData.web_url || '',
    name: project.gitRepoUrl?.split('/').pop() || '',
    url: repoData.html_url || repoData.web_url || project.gitRepoUrl || '',
  };
  const repoStats = repoDataQuery.data as RepoData | undefined;
  const contributors = repoStats?.contributors;
  const issuesCount = repoStats?.issuesCount || 0;
  const pullRequestsCount = repoStats?.pullRequestsCount || 0;
  const issues = (otherQueries[0].data as Issue[] | undefined) || [];
  const pullRequests = (otherQueries[1].data as PullRequest[] | undefined) || [];
  const readme = otherQueries[2].data as RepoContent | undefined;
  const contributing = otherQueries[3].data as RepoContent | undefined;
  const codeOfConduct = otherQueries[4].data as RepoContent | undefined;

  return (
    <div className="mt-4 px-6 md:mt-8">
      <div
        className={`pointer-events-none fixed top-[calc(32px+65px)] z-10 h-10 w-full bg-gradient-to-b from-[#101010] to-transparent transition-all duration-300 ${
          showShadow ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div className="fixed top-0 right-0 left-0 z-10 h-[32px] bg-[#101010]" />
      <div className="mx-auto max-w-[1080px] py-4">
        <ClaimProjectSection
          isUnclaimed={isUnclaimed}
          user={user}
          project={project}
          className="mt-0 mb-4 w-full rounded-none border border-neutral-800 bg-neutral-900/50 p-2"
        />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-4 overflow-hidden lg:col-span-2">
            <ProjectDescription isOwner={isOwner} project={project} repo={repo} />

            <div className="">
              <Tabs defaultValue="readme" className="w-full">
                <div className="mb-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <TabsList className="min-w-max bg-neutral-900/0 p-0">
                    <TabsTrigger value="readme" className="rounded-none text-sm whitespace-nowrap">
                      <FileText className="h-4 w-4" />
                      <span className="hidden sm:inline">README</span>
                      <span className="sm:hidden">README</span>
                    </TabsTrigger>
                    <TabsTrigger value="issues" className="rounded-none text-sm whitespace-nowrap">
                      <AlertCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">Issues</span>
                      <span className="sm:hidden">Issues</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="pull-requests"
                      className="rounded-none text-sm whitespace-nowrap"
                    >
                      <GitPullRequest className="h-4 w-4" />
                      <span className="hidden sm:inline">Pull Requests</span>
                      <span className="sm:hidden">PRs</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="contributing"
                      className="rounded-none text-sm whitespace-nowrap"
                    >
                      <Users className="h-4 w-4" />
                      <span className="hidden sm:inline">Contributing</span>
                      <span className="sm:hidden">Contributing</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="code-of-conduct"
                      className="rounded-none text-sm whitespace-nowrap"
                    >
                      <Heart className="h-4 w-4" />
                      <span className="hidden sm:inline">Code of Conduct</span>
                      <span className="sm:hidden">Code of Conduct</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
                <div className="overflow-x-hidden overflow-y-auto lg:overflow-x-visible lg:overflow-y-visible">
                  <TabsContent value="readme">
                    {readme ? (
                      <div className="rounded-none border border-neutral-800 bg-neutral-900/50 p-6">
                        <MarkdownContent
                          content={readme.content}
                          encoding={
                            readme.encoding === 'base64' || readme.encoding === 'utf8'
                              ? readme.encoding
                              : 'base64'
                          }
                        />
                      </div>
                    ) : (
                      <div className="rounded-none border border-neutral-800 bg-neutral-900/50 p-6">
                        <div className="py-8 text-center">
                          <FileText className="mx-auto mb-4 h-12 w-12 text-neutral-600" />
                          <h3 className="mb-2 text-lg font-medium text-neutral-300">
                            No README found
                          </h3>
                          <p className="mx-auto mb-4 max-w-md text-sm text-neutral-400">
                            A README file typically contains information about the project, how to
                            install and use it, and other important details for users and
                            contributors.
                          </p>
                          <p className="text-xs text-neutral-500">
                            Common filenames: README.md, README.rst, README.txt
                          </p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="issues">
                    {otherQueries[0].isLoading ? (
                      <div className="flex w-full justify-center py-4">
                        <LoadingSpinner />
                      </div>
                    ) : issues ? (
                      issues.length === 0 ? (
                        <p className="text-sm text-neutral-400">No issues found</p>
                      ) : issues.filter(
                          (issue) =>
                            issue &&
                            (!issue.pull_request || issue.pull_request === null) &&
                            issue.state === 'open',
                        ).length > 0 ? (
                        <div className="space-y-3">
                          {issues
                            .filter(
                              (issue) =>
                                issue &&
                                (!issue.pull_request || issue.pull_request === null) &&
                                issue.state === 'open',
                            )
                            .slice(0, 10)
                            .map((issue) => (
                              <div
                                key={issue.id}
                                className="rounded-none border border-neutral-800 p-4 transition-colors hover:border-neutral-700"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      {issue.state === 'open' ? (
                                        <div className="flex items-center gap-1 text-emerald-400">
                                          <AlertCircle className="h-4 w-4" />
                                          <span className="text-xs font-medium">Open</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1 text-purple-400">
                                          <CheckCircle className="h-4 w-4" />
                                          <span className="text-xs font-medium">Closed</span>
                                        </div>
                                      )}
                                      <span className="text-xs text-neutral-500">
                                        #{issue.number || issue.iid}
                                      </span>
                                    </div>
                                    <Link
                                      href={issue.html_url || issue.web_url || '#'}
                                      event="project_page_issue_link_clicked"
                                      eventObject={{ projectId: project.id }}
                                      target="_blank"
                                      className="mt-2 block text-sm font-medium text-neutral-300 transition-colors hover:text-white"
                                    >
                                      {issue.title}
                                    </Link>
                                    {issue.labels && issue.labels.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-1">
                                        {issue.labels.map((label, idx) => {
                                          if (typeof label === 'string') {
                                            return (
                                              <span
                                                key={idx}
                                                className="rounded-full bg-neutral-700 px-2 py-0.5 text-xs text-neutral-200"
                                              >
                                                {label}
                                              </span>
                                            );
                                          }

                                          return (
                                            <span
                                              key={label.id || idx}
                                              className="rounded-full px-2 py-0.5 text-xs"
                                              style={{
                                                backgroundColor: `#${label.color}20`,
                                                color: `#${label.color}`,
                                                border: `1px solid #${label.color}40`,
                                              }}
                                            >
                                              {label.name}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    )}
                                    <div className="mt-2 flex items-center gap-4 text-xs text-neutral-500">
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>{formatDate(new Date(issue.created_at))}</span>
                                      </div>
                                      <span>by {issue.user?.login || issue.author?.username}</span>
                                    </div>
                                  </div>
                                  <Link
                                    href={issue.html_url || issue.web_url || '#'}
                                    target="_blank"
                                    className="text-neutral-400 transition-colors hover:text-white"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Link>
                                </div>
                              </div>
                            ))}
                          {issuesCount > 10 && (
                            <Link
                              href={
                                project?.gitHost === 'github'
                                  ? `${repo?.html_url}/issues?q=is%3Aopen`
                                  : `${repo?.web_url}/-/issues?state=opened`
                              }
                              target="_blank"
                              event="project_page_issues_link_clicked"
                              eventObject={{ projectId: project.id }}
                              className="block pt-2 text-center text-sm text-neutral-400 transition-colors hover:text-white"
                            >
                              View all {issuesCount} open issues on{' '}
                              {project?.gitHost === 'github' ? 'GitHub' : 'GitLab'} →
                            </Link>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-neutral-400">No open issues found</p>
                      )
                    ) : (
                      <p className="text-sm text-neutral-400">Error loading issues</p>
                    )}
                  </TabsContent>
                  <TabsContent value="pull-requests">
                    {otherQueries[1].isLoading ? (
                      <div className="flex w-full justify-center py-4">
                        <LoadingSpinner className="h-16 w-16" />
                      </div>
                    ) : pullRequests ? (
                      pullRequests.length === 0 ? (
                        <p className="text-sm text-neutral-400">No pull requests found</p>
                      ) : pullRequests.filter((pr) => pr && pr.state === 'open').length > 0 ? (
                        <div className="space-y-3">
                          {pullRequests
                            .filter((pr) => pr && pr.state === 'open')
                            .slice(0, 10)
                            .map((pr) => (
                              <div
                                key={pr.id}
                                className="rounded-none border border-neutral-800 p-4 transition-colors hover:border-neutral-700"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      {pr.draft ? (
                                        <div className="flex items-center gap-1 text-gray-400">
                                          <GitPullRequest className="h-4 w-4" />
                                          <span className="text-xs font-medium">Draft</span>
                                        </div>
                                      ) : pr.state === 'open' ? (
                                        <div className="flex items-center gap-1 text-blue-400">
                                          <GitPullRequest className="h-4 w-4" />
                                          <span className="text-xs font-medium">Open</span>
                                        </div>
                                      ) : pr.merged_at ? (
                                        <div className="flex items-center gap-1 text-purple-400">
                                          <GitMerge className="h-4 w-4" />
                                          <span className="text-xs font-medium">Merged</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1 text-red-400">
                                          <XCircle className="h-4 w-4" />
                                          <span className="text-xs font-medium">Closed</span>
                                        </div>
                                      )}
                                      <span className="text-xs text-neutral-500">
                                        #{pr.number || pr.iid}
                                      </span>
                                    </div>
                                    <Link
                                      href={pr.html_url || pr.web_url || '#'}
                                      target="_blank"
                                      event="project_page_pull_request_link_clicked"
                                      eventObject={{ projectId: project.id }}
                                      className="mt-2 block text-sm font-medium text-neutral-300 transition-colors hover:text-white"
                                    >
                                      {pr.title}
                                    </Link>
                                    {pr.labels && pr.labels.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-1">
                                        {pr.labels.map((label, idx) => {
                                          if (typeof label === 'string') {
                                            return (
                                              <span
                                                key={idx}
                                                className="rounded-full bg-neutral-700 px-2 py-0.5 text-xs text-neutral-200"
                                              >
                                                {label}
                                              </span>
                                            );
                                          }

                                          return (
                                            <span
                                              key={label.id || idx}
                                              className="rounded-full px-2 py-0.5 text-xs"
                                              style={{
                                                backgroundColor: `#${label.color}20`,
                                                color: `#${label.color}`,
                                                border: `1px solid #${label.color}40`,
                                              }}
                                            >
                                              {label.name}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    )}
                                    <div className="mt-2 flex items-center gap-4 text-xs text-neutral-500">
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>{formatDate(new Date(pr.created_at))}</span>
                                      </div>
                                      <span>by {pr.user?.login || pr.author?.username}</span>
                                      {pr.merged_at && (
                                        <span className="text-purple-400">
                                          merged {formatDate(new Date(pr.merged_at))}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Link
                                    href={pr.html_url || pr.web_url || '#'}
                                    event="project_page_pull_request_link_clicked"
                                    eventObject={{ projectId: project.id }}
                                    target="_blank"
                                    className="text-neutral-400 transition-colors hover:text-white"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Link>
                                </div>
                              </div>
                            ))}
                          {pullRequestsCount > 10 && (
                            <Link
                              href={
                                project?.gitHost === 'github'
                                  ? `${repo?.html_url}/pulls?q=is%3Apr+is%3Aopen`
                                  : `${repo?.web_url}/-/merge_requests?state=opened`
                              }
                              target="_blank"
                              event="project_page_pull_requests_link_clicked"
                              eventObject={{ projectId: project.id }}
                              className="block pt-2 text-center text-sm text-neutral-400 transition-colors hover:text-white"
                            >
                              View all {pullRequestsCount} open pull requests on{' '}
                              {project?.gitHost === 'github' ? 'GitHub' : 'GitLab'} →
                            </Link>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-neutral-400">No open pull requests found</p>
                      )
                    ) : (
                      <p className="text-sm text-neutral-400">Error loading pull requests</p>
                    )}
                  </TabsContent>
                  <TabsContent value="contributing">
                    {contributing ? (
                      <div className="rounded-none border border-neutral-800 bg-neutral-900/50 p-6">
                        <MarkdownContent
                          content={contributing.content}
                          encoding={
                            contributing.encoding === 'base64' || contributing.encoding === 'utf8'
                              ? contributing.encoding
                              : 'base64'
                          }
                        />
                      </div>
                    ) : (
                      <div className="rounded-none border border-neutral-800 bg-neutral-900/50 p-6">
                        <div className="py-8 text-center">
                          <Users className="mx-auto mb-4 h-12 w-12 text-neutral-600" />
                          <h3 className="mb-2 text-lg font-medium text-neutral-300">
                            No contributing guidelines found
                          </h3>
                          <p className="mx-auto mb-4 max-w-md text-sm text-neutral-400">
                            Contributing guidelines help new contributors understand how to
                            participate in the project, including coding standards, pull request
                            processes, and community expectations.
                          </p>
                          <p className="text-xs text-neutral-500">
                            Common filenames: CONTRIBUTING.md, .github/CONTRIBUTING.md,
                            docs/CONTRIBUTING.md
                          </p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="code-of-conduct">
                    {codeOfConduct ? (
                      <div className="rounded-none border border-neutral-800 bg-neutral-900/50 p-6">
                        <MarkdownContent
                          content={codeOfConduct.content}
                          encoding={
                            codeOfConduct.encoding === 'base64' || codeOfConduct.encoding === 'utf8'
                              ? codeOfConduct.encoding
                              : 'base64'
                          }
                        />
                      </div>
                    ) : (
                      <div className="rounded-none border border-neutral-800 bg-neutral-900/50 p-6">
                        <div className="py-8 text-center">
                          <Heart className="mx-auto mb-4 h-12 w-12 text-neutral-600" />
                          <h3 className="mb-2 text-lg font-medium text-neutral-300">
                            No code of conduct found
                          </h3>
                          <p className="mx-auto mb-4 max-w-md text-sm text-neutral-400">
                            A code of conduct establishes community standards, outlines expected
                            behavior, and provides guidelines for creating a welcoming and inclusive
                            environment for all contributors.
                          </p>
                          <p className="text-xs text-neutral-500">
                            Common filenames: CODE_OF_CONDUCT.md, COC.md, .github/CODE_OF_CONDUCT.md
                          </p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:col-span-1">
            <div className="border border-neutral-800 bg-neutral-900/50 p-4 md:p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Project Info</h2>

              <div className="mb-6">
                <h3 className="mb-3 text-sm font-medium text-neutral-300">Repository Stats</h3>
                <div className="grid grid-cols-2 gap-3 sm:block sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-neutral-400">
                      <Star className="h-4 w-4" />
                      <span className="text-sm">Stars</span>
                    </div>
                    <span className="text-sm">
                      {repo?.stargazers_count || repo?.star_count || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-neutral-400">
                      <GitFork className="h-4 w-4" />
                      <span className="text-sm">Forks</span>
                    </div>
                    <span className="text-sm">{repo?.forks_count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-neutral-400">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">Contributors</span>
                    </div>
                    <span className="text-sm">{contributors?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-neutral-400">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">Open Issues</span>
                    </div>
                    <span className="text-sm">{issuesCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-neutral-400">
                      <GitPullRequest className="h-4 w-4" />
                      <span className="text-sm">Open PRs</span>
                    </div>
                    <span className="text-sm">{pullRequestsCount}</span>
                  </div>
                </div>
              </div>

              <Separator className="my-6 bg-neutral-700/40" />

              <div>
                <h3 className="mb-3 text-sm font-medium text-neutral-300">About</h3>
                <div className="space-y-2 text-sm">
                  {project?.createdAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Created</span>
                      <span className="text-neutral-300">
                        {formatDate(new Date(repo?.created_at as string))}
                      </span>
                    </div>
                  )}
                  {project?.updatedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Updated</span>
                      <span className="text-neutral-300">
                        {formatDate(new Date(repo?.updated_at as string))}
                      </span>
                    </div>
                  )}
                  {project?.gitHost && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Host</span>
                      <span className="text-neutral-300 capitalize">{project?.gitHost}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Visibility</span>
                    <span className="text-neutral-300">
                      {project?.isPublic ? 'Public' : 'Private'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-neutral-800 bg-neutral-900/50 p-4 md:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <Tag className="h-5 w-5" />
                Tags
              </h2>
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                {project?.tagRelations?.map((relation, index: number) => (
                  <span
                    key={index}
                    className="rounded-none bg-neutral-800 px-2.5 py-1 text-xs text-neutral-300 transition-colors hover:bg-neutral-700"
                  >
                    {relation.tag?.displayName || relation.tag?.name}
                  </span>
                ))}
              </div>
            </div>

            {project?.hasBeenAcquired && project?.acquiredBy && (
              <div className="border border-yellow-500/20 bg-yellow-500/5 p-4 md:p-6">
                <div className="flex items-center gap-2 text-yellow-400">
                  <Building className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">Acquisition</h2>
                </div>
                <p className="mt-2 text-sm text-neutral-300">This project has been acquired</p>
              </div>
            )}
            {(project?.isLookingForContributors ||
              project?.isLookingForInvestors ||
              project?.isHiring) && (
              <div className="border border-neutral-800 bg-neutral-900/50 p-4 md:p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">Opportunities</h2>
                <div className="space-y-3">
                  {project?.isLookingForContributors && (
                    <div className="flex items-start gap-3 rounded-none border border-[#00BC7D]/10 bg-[#00BC7D]/10 p-3 text-[#00D492]">
                      <Users className="mt-0.5 h-5 w-5 text-emerald-400" />
                      <div>
                        <p className="font-medium text-emerald-400">Open to Contributors</p>
                        <p className="text-sm text-neutral-400">
                          This project is actively seeking contributors
                        </p>
                      </div>
                    </div>
                  )}
                  {project?.isLookingForInvestors && (
                    <div className="flex items-start gap-3 rounded-none border border-blue-500/30 bg-blue-500/10 p-3">
                      <DollarSign className="mt-0.5 h-5 w-5 text-blue-400" />
                      <div>
                        <p className="font-medium text-blue-400">Seeking Investment</p>
                        <p className="text-sm text-neutral-400">
                          Open to investor discussions and funding
                        </p>
                      </div>
                    </div>
                  )}
                  {project?.isHiring && (
                    <div className="flex items-start gap-3 rounded-none border border-purple-500/20 bg-purple-500/10 p-3">
                      <Briefcase className="mt-0.5 h-5 w-5 text-purple-400" />
                      <div>
                        <p className="font-medium text-purple-400">We&apos;re Hiring!</p>
                        <p className="text-sm text-neutral-400">Check out available positions</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ClaimProjectSectionProps {
  isUnclaimed: boolean;
  user?: { id: string } | null;
  project: ProjectWithRelations;
  className: string;
}

function ClaimProjectSection({ isUnclaimed, user, project, className }: ClaimProjectSectionProps) {
  if (!isUnclaimed || !user) return null;

  return (
    <div className={className}>
      <div className="flex w-full flex-row items-center justify-between gap-2">
        <div className="ml-2 flex flex-row items-center justify-start gap-2">
          <p className="text-center text-xs text-neutral-400">
            This project hasn&apos;t been claimed yet
          </p>
        </div>
        <ClaimProjectDialog
          projectId={project.id}
          provider={project.gitHost as (typeof projectProviderEnum.enumValues)[number]}
        />
      </div>
    </div>
  );
}
