'use client';

import {
  AlertCircle,
  Briefcase,
  Building,
  CheckCircle,
  Clock,
  DollarSign,
  ExternalLink,
  GitFork,
  GitMerge,
  GitPullRequest,
  Star,
  Tag,
  Users,
  XCircle,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';
import ProjectDescription from './_components/project-description';
import { Separator } from '@workspace/ui/components/separator';
import { useQueries, useQuery } from '@tanstack/react-query';
import { projectProviderEnum } from '@workspace/db/schema';
import LoadingSpinner from '@/components/loading-spinner';
import { authClient } from '@workspace/auth/client';
import Link from '@workspace/ui/components/link';
import NumberFlow from '@number-flow/react';
import { useTRPC } from '@/hooks/use-trpc';
import { formatDate } from '@/lib/utils';

// TODO: finish this file
type GitHubIssue = RestEndpointMethodTypes['issues']['listForRepo']['response']['data'][0];
type GitHubPullRequest = RestEndpointMethodTypes['pulls']['list']['response']['data'][0];

const isValidProvider = (
  provider: string | null | undefined,
): provider is (typeof projectProviderEnum.enumValues)[number] => {
  return provider === 'github' || provider === 'gitlab';
};

function useProject(id: string) {
  const trpc = useTRPC();
  const query = useQuery(trpc.projects.getProject.queryOptions({ id }));

  return {
    project: query.data,
  };
}

export default function ProjectPage({ id }: { id: string }) {
  const { project } = useProject(id);
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const trpc = useTRPC();

  const repoData = useQueries({
    queries: [
      trpc.repository.getRepo.queryOptions(
        {
          url: project?.gitRepoUrl!,
          provider: project?.gitHost as (typeof projectProviderEnum.enumValues)[number],
        },
        { enabled: !!project?.gitRepoUrl && isValidProvider(project?.gitHost) },
      ),
      trpc.repository.getContributors.queryOptions(
        {
          url: project?.gitRepoUrl!,
          provider: project?.gitHost as (typeof projectProviderEnum.enumValues)[number],
        },
        { enabled: !!project?.gitRepoUrl && isValidProvider(project?.gitHost) },
      ),
      trpc.repository.getIssues.queryOptions(
        {
          url: project?.gitRepoUrl!,
          provider: project?.gitHost as (typeof projectProviderEnum.enumValues)[number],
        },
        { enabled: !!project?.gitRepoUrl && isValidProvider(project?.gitHost) },
      ),
      trpc.repository.getPullRequests.queryOptions(
        {
          url: project?.gitRepoUrl!,
          provider: project?.gitHost as (typeof projectProviderEnum.enumValues)[number],
        },
        { enabled: !!project?.gitRepoUrl && isValidProvider(project?.gitHost) },
      ),
    ],
  });

  if (!project || !project.gitRepoUrl)
    return (
      <div className="flex h-[calc(100vh-100px)] w-full items-center justify-center">
        Project not found
      </div>
    );

  const isUnclaimed = !project.ownerId;
  const isOwner = user?.id === project.ownerId;

  const repo = repoData[0].data;
  const contributors = repoData[1].data;
  const issues = repoData[2].data;
  const pullRequests = repoData[3].data;

  if (!repo || !contributors || !issues || !pullRequests) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="mt-4 px-6 md:mt-8">
      <div className="mx-auto max-w-[1080px] py-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-4 overflow-hidden lg:col-span-2">
            <ProjectDescription
              isOwner={isOwner}
              isUnclaimed={isUnclaimed}
              project={project}
              repo={repo}
              user={user}
            />

            <div className="border border-neutral-800 bg-neutral-900/50 p-4 md:p-6">
              <Tabs defaultValue="issues" className="w-full">
                <TabsList className="bg-neutral-900/0 p-0">
                  <TabsTrigger value="issues" className="text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Issues</span>
                    <span className="sm:hidden">Issues</span>
                  </TabsTrigger>
                  <TabsTrigger value="pull-requests" className="text-sm">
                    <GitPullRequest className="h-4 w-4" />
                    <span className="hidden sm:inline">Pull Requests</span>
                    <span className="sm:hidden">PRs</span>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="issues">
                  {issues && issues.filter((issue: any) => !issue.pull_request).length > 0 ? (
                    <div className="space-y-3">
                      {issues
                        .filter((issue: any) => !issue.pull_request)
                        .slice(0, 10)
                        .map((issue: any) => (
                          <div
                            key={issue.id}
                            className="rounded-md border border-neutral-800 p-4 transition-colors hover:border-neutral-700"
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
                                  href={issue.html_url || issue.web_url}
                                  event="project_page_issue_link_clicked"
                                  eventObject={{ projectId: project.id }}
                                  target="_blank"
                                  className="mt-2 block text-sm font-medium text-neutral-300 transition-colors hover:text-white"
                                >
                                  {issue.title}
                                </Link>
                                {issue.labels && issue.labels.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {issue.labels.map((label: any) => (
                                      <span
                                        key={label.id || label}
                                        className="rounded-full px-2 py-0.5 text-xs"
                                        style={{
                                          backgroundColor: `#${label.color}20`,
                                          color: `#${label.color}`,
                                          border: `1px solid #${label.color}40`,
                                        }}
                                      >
                                        {label.name}
                                      </span>
                                    ))}
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
                                href={issue.html_url || issue.web_url}
                                target="_blank"
                                className="text-neutral-400 transition-colors hover:text-white"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            </div>
                          </div>
                        ))}
                      {issues.filter((issue: any) => !issue.pull_request).length > 10 && (
                        <Link
                          href={`${repo?.html_url}/issues`}
                          target="_blank"
                          event="project_page_issues_link_clicked"
                          eventObject={{ projectId: project.id }}
                          className="block pt-2 text-center text-sm text-neutral-400 transition-colors hover:text-white"
                        >
                          View all {issues.filter((issue: any) => !issue.pull_request).length}{' '}
                          issues on GitHub →
                        </Link>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-400">No issues found</p>
                  )}
                </TabsContent>
                <TabsContent value="pull-requests">
                  {pullRequests && pullRequests.length > 0 ? (
                    <div className="space-y-3">
                      {pullRequests.slice(0, 10).map((pr: any) => (
                        <div
                          key={pr.id}
                          className="rounded-md border border-neutral-800 p-4 transition-colors hover:border-neutral-700"
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
                                href={pr.html_url || pr.web_url}
                                target="_blank"
                                event="project_page_pull_request_link_clicked"
                                eventObject={{ projectId: project.id }}
                                className="mt-2 block text-sm font-medium text-neutral-300 transition-colors hover:text-white"
                              >
                                {pr.title}
                              </Link>
                              {pr.labels && pr.labels.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {pr.labels.map((label: any) => (
                                    <span
                                      key={label.id || label}
                                      className="rounded-full px-2 py-0.5 text-xs"
                                      style={{
                                        backgroundColor: `#${label.color}20`,
                                        color: `#${label.color}`,
                                        border: `1px solid #${label.color}40`,
                                      }}
                                    >
                                      {label.name}
                                    </span>
                                  ))}
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
                              href={pr.html_url || pr.web_url}
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
                      {pullRequests.length > 10 && (
                        <Link
                          href={`${repo?.html_url}/pulls`}
                          target="_blank"
                          event="project_page_pull_requests_link_clicked"
                          eventObject={{ projectId: project.id }}
                          className="block pt-2 text-center text-sm text-neutral-400 transition-colors hover:text-white"
                        >
                          View all {pullRequests.length} pull requests on GitHub →
                        </Link>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-400">No pull requests</p>
                  )}
                </TabsContent>
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
                    <span className="text-base font-bold text-white sm:text-lg">
                      <NumberFlow value={repo?.stargazers_count || repo?.star_count || 0} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-neutral-400">
                      <GitFork className="h-4 w-4" />
                      <span className="text-sm">Forks</span>
                    </div>
                    <span className="text-base font-bold text-white sm:text-lg">
                      <NumberFlow value={repo?.forks_count || 0} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-neutral-400">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">Contributors</span>
                    </div>
                    <span className="text-base font-bold text-white sm:text-lg">
                      <NumberFlow value={contributors?.length || 0} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-neutral-400">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">Issues</span>
                    </div>
                    <span className="text-base font-bold text-white sm:text-lg">
                      {issues?.filter(
                        (issue: any) =>
                          !issue.pull_request &&
                          (issue.state === 'open' || issue.state === 'opened'),
                      ).length || 0}
                    </span>
                  </div>
                </div>
              </div>

              <Separator className="my-6 bg-neutral-700" />

              <div>
                <h3 className="mb-3 text-sm font-medium text-neutral-300">About</h3>
                <div className="space-y-2 text-sm">
                  {project?.createdAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Created</span>
                      <span className="text-neutral-300">
                        {formatDate(new Date(repo?.created_at!))}
                      </span>
                    </div>
                  )}
                  {project?.updatedAt && (
                    <>
                      <Separator className="bg-neutral-800" />
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Updated</span>
                        <span className="text-neutral-300">
                          {formatDate(new Date(repo?.updated_at!))}
                        </span>
                      </div>
                    </>
                  )}
                  {project?.gitHost && (
                    <>
                      <Separator className="bg-neutral-800" />
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Host</span>
                        <span className="text-neutral-300 capitalize">{project?.gitHost}</span>
                      </div>
                    </>
                  )}
                  <Separator className="bg-neutral-800" />
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
                {project?.tags?.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="rounded-full bg-neutral-800 px-2.5 py-1 text-xs text-neutral-300 transition-colors hover:bg-neutral-700 md:px-3 md:text-sm"
                  >
                    #{tag}
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
                    <div className="flex items-start gap-3 rounded-md bg-emerald-500/10 p-3">
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
                    <div className="flex items-start gap-3 rounded-md bg-blue-500/10 p-3">
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
                    <div className="flex items-start gap-3 rounded-md bg-purple-500/10 p-3">
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
