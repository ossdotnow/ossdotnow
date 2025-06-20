'use client';

import {
  Briefcase,
  Building,
  DollarSign,
  ExternalLink,
  GitFork,
  Github,
  Globe,
  Linkedin,
  Star,
  Tag,
  Twitter,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  GitPullRequest,
  GitMerge,
  XCircle,
  // Shield,
  // User,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';
import { ClaimProjectDialog } from '@/components/project/claim-project-dialog';
import { Separator } from '@workspace/ui/components/separator';
import ProjectTicks from '@/components/project/project-ticks';
import { Button } from '@workspace/ui/components/button';
import { authClient } from '@workspace/auth/client';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/hooks/use-trpc';
import { formatDate } from '@/lib/utils';
import Link from '@/components/link';
import Image from 'next/image';

type GitHubIssue = RestEndpointMethodTypes['issues']['listForRepo']['response']['data'][0];
type GitHubPullRequest = RestEndpointMethodTypes['pulls']['list']['response']['data'][0];

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

  const { data: repoData } = useQuery(
    trpc.github.getRepoData.queryOptions(
      { repo: project?.gitRepoUrl! },
      { enabled: !!project?.gitRepoUrl },
    ),
  );

  const repo = repoData?.repo;
  const contributors = repoData?.contributors;
  const issues = repoData?.issues;
  const pullRequests = repoData?.pullRequests;

  if (!project || !project.gitRepoUrl) return <div>Project not found</div>;

  const isUnclaimed = !project.ownerId;
  const isOwner = user?.id === project.ownerId;

  return (
    <div className="mt-8">
      <div className="mx-auto max-w-6xl border border-neutral-800 bg-neutral-900/50 py-8">
        <div className="px-4">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <Image
                src={repo?.owner.avatar_url ?? 'https://placehold.co/100x100'}
                alt={project?.name ?? 'Project Logo'}
                width={100}
                height={100}
                className="h-24 w-24 rounded-full border border-neutral-800"
                unoptimized
              />
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-white">{project?.name}</h1>
                  <ProjectTicks project={project} />
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <span className="rounded-md bg-neutral-800 px-3 py-1 text-sm font-medium text-neutral-300">
                    {project?.status?.replace('-', ' ')}
                  </span>
                  <span className="rounded-md bg-neutral-800 px-3 py-1 text-sm font-medium text-neutral-300">
                    {project?.type?.replace('-', ' ')}
                  </span>
                  {project?.hasBeenAcquired && (
                    <span className="rounded-md bg-yellow-500/10 px-3 py-1 text-sm font-medium text-yellow-400">
                      Acquired
                    </span>
                  )}
                </div>
                {project?.socialLinks && (
                  <div className="mt-4 flex gap-4">
                    {project.socialLinks.website && (
                      <Link
                        href={project.socialLinks.website}
                        target="_blank"
                        event="project_page_website_link_clicked"
                        eventObject={{ projectId: project.id }}
                        className="flex items-center gap-1 text-neutral-300 transition-colors hover:text-white"
                      >
                        <Globe className="h-3 w-3" />
                        <span className="text-sm">Website</span>
                        <ExternalLink className="ml-auto h-3 w-3" />
                      </Link>
                    )}
                    {project.socialLinks.github && (
                      <Link
                        href={project.socialLinks.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        event="project_page_github_link_clicked"
                        eventObject={{ projectId: project.id }}
                        className="flex items-center gap-1 text-neutral-300 transition-colors hover:text-white"
                      >
                        <Github className="h-3 w-3" />
                        <span className="text-sm">GitHub</span>
                        <ExternalLink className="ml-auto h-3 w-3" />
                      </Link>
                    )}
                    {project.socialLinks.twitter && (
                      <Link
                        href={project.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        event="project_page_twitter_link_clicked"
                        eventObject={{ projectId: project.id }}
                        className="flex items-center gap-1 text-neutral-300 transition-colors hover:text-white"
                      >
                        <Twitter className="h-3 w-3" />
                        <span className="text-sm">Twitter</span>
                        <ExternalLink className="ml-auto h-3 w-3" />
                      </Link>
                    )}
                    {project.socialLinks.linkedin && (
                      <Link
                        href={project.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        event="project_page_linkedin_link_clicked"
                        eventObject={{ projectId: project.id }}
                        className="flex items-center gap-1 text-neutral-300 transition-colors hover:text-white"
                      >
                        <Linkedin className="h-3 w-3" />
                        <span className="text-sm">LinkedIn</span>
                        <ExternalLink className="ml-auto h-3 w-3" />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end justify-end gap-2">
              <Link
                href={repo?.html_url ?? '#'}
                target="_blank"
                event="project_page_github_link_clicked"
                eventObject={{ projectId: project.id }}
              >
                <Button
                  variant="outline"
                  className="rounded-none border-neutral-800 bg-neutral-900 hover:border-neutral-700"
                >
                  <Github className="h-4 w-4" />
                  View on GitHub
                </Button>
              </Link>

              {isUnclaimed && user && (
                <div className="bg-background/50 mt-4 flex flex-col items-end gap-2 border p-4">
                  <h3 className="mb-2 text-sm font-medium">Project Ownership</h3>
                  <p className="text-muted-foreground mb-3 text-sm">
                    This project hasn&apos;t been claimed yet.
                  </p>
                  <ClaimProjectDialog projectId={project.id} />
                </div>
              )}

              {isOwner && (
                <div className="mt-4">
                  <Button variant="outline" size="sm" asChild className="rounded-none">
                    <Link href={`/projects/${project.id}/edit`}>Edit Project Details</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl py-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <div className="border border-neutral-800 bg-neutral-900/50 p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Description</h2>
              <div className="mb-4">
                <p className="mt-2 text-base text-neutral-400">{project?.description}</p>
              </div>
              <h2 className="mb-4 text-lg font-semibold text-white">Repository Stats</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-neutral-400">
                    <Star className="h-4 w-4" />
                    <span className="text-sm">Stars</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {repo?.stargazers_count?.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-neutral-400">
                    <GitFork className="h-4 w-4" />
                    <span className="text-sm">Forks</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {repo?.forks_count?.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-neutral-400">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Contributors</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {contributors?.length?.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-neutral-400">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Open Issues</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {issues?.filter(
                      (issue: GitHubIssue) => !issue.pull_request && issue.state === 'open',
                    ).length || 0}
                  </p>
                </div>
              </div>
            </div>

            {(project?.isLookingForContributors ||
              project?.isLookingForInvestors ||
              project?.isHiring) && (
              <div className="border border-neutral-800 bg-neutral-900/50 p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">Opportunities</h2>
                <div className="space-y-3">
                  {project?.isLookingForContributors && (
                    <div className="flex items-center gap-3 rounded-md bg-emerald-500/10 p-3 pl-4">
                      <Users className="h-5 w-5 text-emerald-400" />
                      <div>
                        <p className="font-medium text-emerald-400">Open to Contributors</p>
                        <p className="text-sm text-neutral-400">
                          This project is actively seeking contributors
                        </p>
                      </div>
                    </div>
                  )}
                  {project?.isLookingForInvestors && (
                    <div className="flex items-center gap-3 rounded-md bg-blue-500/10 p-3 pl-4">
                      <DollarSign className="h-5 w-5 text-blue-400" />
                      <div>
                        <p className="font-medium text-blue-400">Seeking Investment</p>
                        <p className="text-sm text-neutral-400">
                          Open to investor discussions and funding
                        </p>
                      </div>
                    </div>
                  )}
                  {project?.isHiring && (
                    <div className="flex items-center gap-3 rounded-md bg-purple-500/10 p-3 pl-4">
                      <Briefcase className="h-5 w-5 text-purple-400" />
                      <div>
                        <p className="font-medium text-purple-400">We&apos;re Hiring!</p>
                        <p className="text-sm text-neutral-400">Check out available positions</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="border border-neutral-800 bg-neutral-900/50 p-6">
              <Tabs defaultValue="issues" className="w-full">
                <TabsList className="bg-neutral-900/0 p-0">
                  <TabsTrigger value="issues">
                    <AlertCircle className="h-4 w-4" />
                    Issues
                  </TabsTrigger>
                  <TabsTrigger value="pull-requests">
                    <GitPullRequest className="h-4 w-4" />
                    Pull Requests
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="issues">
                  {issues &&
                  issues.filter((issue: GitHubIssue) => !issue.pull_request).length > 0 ? (
                    <div className="space-y-3">
                      {issues
                        .filter((issue: GitHubIssue) => !issue.pull_request)
                        .slice(0, 10)
                        .map((issue: GitHubIssue) => (
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
                                  <span className="text-xs text-neutral-500">#{issue.number}</span>
                                </div>
                                <Link
                                  href={issue.html_url}
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
                                        key={label.id}
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
                                  <span>by {issue.user?.login}</span>
                                </div>
                              </div>
                              <Link
                                href={issue.html_url}
                                target="_blank"
                                className="text-neutral-400 transition-colors hover:text-white"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            </div>
                          </div>
                        ))}
                      {issues.filter((issue: GitHubIssue) => !issue.pull_request).length > 10 && (
                        <Link
                          href={`${repo?.html_url}/issues`}
                          target="_blank"
                          event="project_page_issues_link_clicked"
                          eventObject={{ projectId: project.id }}
                          className="block pt-2 text-center text-sm text-neutral-400 transition-colors hover:text-white"
                        >
                          View all{' '}
                          {issues.filter((issue: GitHubIssue) => !issue.pull_request).length} issues
                          on GitHub →
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
                      {pullRequests.slice(0, 10).map((pr: GitHubPullRequest) => (
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
                                <span className="text-xs text-neutral-500">#{pr.number}</span>
                              </div>
                              <Link
                                href={pr.html_url}
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
                                      key={label.id}
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
                                <span>by {pr.user?.login}</span>
                                {pr.merged_at && (
                                  <span className="text-purple-400">
                                    merged {formatDate(new Date(pr.merged_at))}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Link
                              href={pr.html_url}
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

          <div className="flex flex-col gap-4">
            <div className="border border-neutral-800 bg-neutral-900/50 p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">About</h2>
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
                      <span className="text-neutral-400">Last Updated</span>
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
                      <span className="capitalize text-neutral-300">{project?.gitHost}</span>
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

            <div className="border border-neutral-800 bg-neutral-900/50 p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <Tag className="h-5 w-5" />
                Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {project?.tags?.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="rounded-full bg-neutral-800 px-3 py-1 text-sm text-neutral-300 transition-colors hover:bg-neutral-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {project?.hasBeenAcquired && project?.acquiredBy && (
              <div className="border border-yellow-500/20 bg-yellow-500/5 p-6">
                <div className="flex items-center gap-2 text-yellow-400">
                  <Building className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">Acquisition</h2>
                </div>
                <p className="mt-2 text-sm text-neutral-300">This project has been acquired</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
