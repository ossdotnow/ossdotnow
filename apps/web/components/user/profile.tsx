'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import {
  Calendar,
  Clock,
  ExternalLink,
  GitFork,
  Globe,
  Heart,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import ProjectCard from '@/app/(public)/(projects)/projects/project-card';
import ResponsiveNumber from '@/components/user/responsive-numbers';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { authClient } from '@workspace/auth/client';
import Icons from '@workspace/ui/components/icons';
import { RecentActivity } from './recent-activity';
import Link from '@workspace/ui/components/link';
import { cn } from '@workspace/ui/lib/utils';
import { useEffect, useState } from 'react';
import { useTRPC } from '@/hooks/use-trpc';
import { useQueryState } from 'nuqs';

interface Profile {
  git?: {
    login: string;
    provider: 'github' | 'gitlab';
  };
}

interface PullRequestData {
  mergedAt?: string;
  isDraft?: boolean;
  createdAt: string;
}

export default function ProfilePage({ id }: { id: string }) {
  const trpc = useTRPC();
  const [tab, setTab] = useQueryState('tab', {
    defaultValue: 'projects',
  });
  const [showShadow, setShowShadow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowShadow(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: profile, isLoading: isProfileLoading } = useQuery(
    trpc.profile.getProfile.queryOptions({ id }),
  );

  const { data: projects } = useQuery(
    trpc.projects.getProjectsByUserId.queryOptions(
      {
        userId: profile?.id ?? '',
        page: 1,
        pageSize: 100,
      },
      {
        enabled: !!profile?.id,
      },
    ),
  );

  const githubUrlRegex = /(?:https?:\/\/github\.com\/|^)([^/]+)\/([^/]+?)(?:\.git|\/|$)/;

  const projectQueries = useQueries({
    queries: (projects?.data || []).map((project) => {
      if (!project.gitRepoUrl) {
        return {
          queryKey: ['github-repo', project.id],
          queryFn: () => null,
          enabled: false,
        };
      }

      const match = project.gitRepoUrl.match(githubUrlRegex);
      if (!match) {
        return {
          queryKey: ['github-repo', project.id],
          queryFn: () => null,
          enabled: false,
        };
      }

      const [, owner, repo] = match;
      const repoPath = `${owner}/${repo}`;

      return trpc.repository.getRepo.queryOptions({ url: repoPath, provider: 'github' });
    }),
  });

  const projectsWithGithubData = projects?.data?.map((project, index) => {
    const githubData = projectQueries[index]?.data;
    return {
      ...project,
      githubData,
      stars: githubData?.stargazers_count || 0,
      forks: githubData?.forks_count || 0,
      lastCommit: githubData?.updated_at
        ? new Date(githubData.updated_at).toLocaleDateString()
        : 'Unknown',
      language: githubData?.language || null,
      openIssues: githubData?.open_issues_count || 0,
      topics: githubData?.topics || [],
    };
  });

  // const featuredProjects = projectsWithGithubData?.filter((project) => project.featured);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const featuredProjects = [] as any[];

  return (
    <div className="relative px-6 pt-10">
      <div
        className={`pointer-events-none fixed top-[calc(32px+65px)] z-10 h-10 w-full bg-gradient-to-b from-[#101010] to-transparent transition-all duration-300 ${
          showShadow ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div className="fixed top-0 right-0 left-0 z-10 h-[33px] bg-[#101010]" />
      <div className="relative mx-auto min-h-[calc(100vh-80px)] max-w-[1080px]">
        <div className="py-4">
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-4">
              {isProfileLoading ? (
                <ProfileSidebarSkeleton />
              ) : (
                <Card className="rounded-none border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
                  <CardContent className="px-6">
                    <div className="text-center">
                      <Avatar className="mx-auto mb-4 h-24 w-24">
                        <AvatarImage src={profile?.image} />
                        <AvatarFallback>
                          {profile?.name?.charAt(0).toUpperCase() ?? 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <h1 className="mb-2 text-2xl font-bold">{profile?.name}</h1>
                      {/* <p className="mb-4 text-neutral-400">{profile?.bio}</p> */}

                      {profile?.git?.location && (
                        <div className="mb-4 flex items-center justify-center space-x-2 text-sm text-neutral-400">
                          <MapPin className="h-4 w-4" />
                          <span>{profile?.git?.location}</span>
                        </div>
                      )}

                      <div className="mb-6 flex items-center justify-center space-x-2 text-sm text-neutral-400">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Joined{' '}
                          {profile?.git?.createdAt &&
                            new Date(profile.git.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="mb-6 flex justify-center space-x-3">
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            href={`https://${profile?.git?.provider}.com/${profile?.git?.login}`}
                            target="_blank"
                          >
                            {profile?.git?.provider === 'github' ? (
                              <Icons.github className="h-4 w-4" />
                            ) : (
                              <Icons.gitlab className="h-4 w-4" />
                            )}
                          </Link>
                        </Button>

                        {profile?.git?.blog ? (
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={profile?.git?.blog ?? ''} target="_blank">
                              <Globe className="h-4 w-4" />
                            </Link>
                          </Button>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold">
                            {(projectsWithGithubData?.length || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-neutral-400">Projects</div>
                        </div>
                        <div>
                          <ResponsiveNumber
                            value={
                              projectsWithGithubData?.reduce((sum, p) => sum + p.stars, 0) || 0
                            }
                            className="text-2xl font-bold"
                          />
                          <div className="text-xs text-neutral-400">Total Stars</div>
                        </div>
                        <div>
                          <ResponsiveNumber
                            value={
                              projectsWithGithubData?.reduce((sum, p) => sum + p.forks, 0) || 0
                            }
                            className="text-2xl font-bold"
                          />
                          <div className="text-xs text-neutral-400">Total Forks</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {profile?.id && (
                <div className="hidden lg:block">
                  <RecentActivity userId={profile.id} />
                </div>
              )}
            </div>

            <div className="lg:col-span-8">
              <Tabs defaultValue={tab} onValueChange={setTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 rounded-none border-neutral-800 bg-neutral-900/50">
                  <TabsTrigger value="projects" className="rounded-none">
                    Projects
                  </TabsTrigger>
                  <TabsTrigger value="contributions" className="rounded-none">
                    Contributions
                  </TabsTrigger>
                  <TabsTrigger value="collections" className="rounded-none">
                    Collections
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="projects" className="mt-6">
                  {featuredProjects.length > 0 ? (
                    <div className="mb-8">
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="flex items-center text-xl font-semibold">
                          <TrendingUp className="mr-2 h-5 w-5 text-orange-500" />
                          Featured Projects
                        </h2>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const container = document.getElementById('featured-carousel');
                              if (container) {
                                container.scrollBy({ left: -300, behavior: 'smooth' });
                              }
                            }}
                            className="h-8 w-8 p-0"
                          >
                            ←
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const container = document.getElementById('featured-carousel');
                              if (container) {
                                container.scrollBy({ left: 300, behavior: 'smooth' });
                              }
                            }}
                            className="h-8 w-8 p-0"
                          >
                            →
                          </Button>
                        </div>
                      </div>
                      <div
                        id="featured-carousel"
                        className="flex space-x-4 overflow-x-auto pb-4"
                        style={{
                          scrollbarWidth: 'none',
                          msOverflowStyle: 'none',
                        }}
                      >
                        {featuredProjects.length > 0 ? (
                          featuredProjects?.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                          ))
                        ) : (
                          <div className="flex items-center justify-center">
                            <p className="text-neutral-400">No featured projects</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <h2 className="mb-4 text-xl font-semibold">All Projects</h2>
                    <div className="space-y-4">
                      {projectsWithGithubData?.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="contributions" className="mt-6">
                  <UserPullRequests profile={profile as Profile} />
                </TabsContent>

                <TabsContent value="collections" className="mt-6">
                  <div className="py-12 text-center">
                    <div className="mb-4 text-neutral-400">
                      <Heart className="mx-auto mb-4 h-12 w-12 opacity-50" />
                      <p>Project collections coming soon...</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            {profile?.id && (
              <div className="block lg:hidden">
                <RecentActivity userId={profile.id} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function UserPullRequests({ profile }: { profile: Profile }) {
  const trpc = useTRPC();
  const [selectedState, setSelectedState] = useQueryState('selectedState', {
    defaultValue: 'all',
  });
  const [sortBy, setSortBy] = useQueryState('sortBy', {
    defaultValue: 'recent',
  });

  const { data, isLoading, error } = useQuery(
    trpc.profile.getUserPullRequests.queryOptions(
      {
        username: profile?.git?.login ?? '',
        provider: profile?.git?.provider ?? 'github',
        state: selectedState as 'all' | 'open' | 'closed' | 'merged',
        limit: 100,
      },
      {
        enabled: !!profile?.git?.login && !!profile?.git?.provider,
      },
    ),
  );

  if (!profile?.git?.login || !profile?.git?.provider) {
    return (
      <div className="py-12 text-center">
        <div className="mb-4 text-neutral-400">
          <Icons.github className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p>No Git provider connected to this profile</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="rounded-none border-neutral-800 bg-neutral-900/50">
            <CardContent className="p-4 py-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Skeleton className="mb-2 h-5 w-3/4 rounded-none" />
                  <Skeleton className="mb-2 h-4 w-1/2 rounded-none" />
                  <Skeleton className="h-4 w-1/4 rounded-none" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <div className="mb-4 text-neutral-400">
          <Icons.github className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p>Failed to load pull requests</p>
          <p className="mt-2 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  const pullRequests = data?.pullRequests || [];

  const calculatePRScore = (pr: PullRequestData) => {
    let score = 0;

    if (pr.mergedAt) score += 20;
    if (pr.isDraft) score -= 10;

    const ageInDays = Math.floor(
      (Date.now() - new Date(pr.createdAt).getTime()) / (1000 * 60 * 60 * 24),
    );
    if (ageInDays < 30) score += 5;

    if (pr.mergedAt && pr.createdAt) {
      const daysToMerge = Math.floor(
        (new Date(pr.mergedAt).getTime() - new Date(pr.createdAt).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (daysToMerge < 3) score += 10;
      else if (daysToMerge > 30) score -= 5;
    }

    return Math.round(score);
  };

  const sortedPullRequests = [...pullRequests].sort((a, b) => {
    switch (sortBy) {
      case 'impact':
        return calculatePRScore(b) - calculatePRScore(a);
      case 'discussion':
        return (
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
        );
      case 'fastest': {
        const aTime = a.mergedAt
          ? new Date(a.mergedAt).getTime() - new Date(a.createdAt).getTime()
          : Infinity;
        const bTime = b.mergedAt
          ? new Date(b.mergedAt).getTime() - new Date(b.createdAt).getTime()
          : Infinity;
        return aTime - bTime;
      }
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const stats = {
    open: pullRequests.filter((pr) => pr.state === 'open').length,
    closed: pullRequests.filter((pr) => pr.state === 'closed' && !pr.mergedAt).length,
    merged: pullRequests.filter((pr) => pr.mergedAt).length,
    avgMergeTime: (() => {
      const mergedPRs = pullRequests.filter((pr) => pr.mergedAt);
      if (mergedPRs.length === 0) return 0;
      const totalTime = mergedPRs.reduce((sum, pr) => {
        return sum + (new Date(pr.mergedAt!).getTime() - new Date(pr.createdAt).getTime());
      }, 0);
      return Math.round(totalTime / mergedPRs.length / (1000 * 60 * 60 * 24));
    })(),
  };

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="rounded-none border-neutral-800 bg-neutral-900/50">
          <CardContent className="p-4 py-0">
            <div className="text-2xl font-bold">{stats.merged}</div>
            <div className="text-xs text-neutral-400">Merged PRs</div>
          </CardContent>
        </Card>
        <Card className="rounded-none border-neutral-800 bg-neutral-900/50">
          <CardContent className="p-4 py-0">
            <div className="text-2xl font-bold">{stats.open}</div>
            <div className="text-xs text-neutral-400">Open PRs</div>
          </CardContent>
        </Card>
        <Card className="rounded-none border-neutral-800 bg-neutral-900/50">
          <CardContent className="p-4 py-0">
            <div className="text-2xl font-bold">{stats.avgMergeTime}d</div>
            <div className="text-xs text-neutral-400">Avg Merge Time</div>
          </CardContent>
        </Card>
        <Card className="rounded-none border-neutral-800 bg-neutral-900/50">
          <CardContent className="p-4 py-0">
            <div className="text-2xl font-bold">{pullRequests.length}</div>
            <div className="text-xs text-neutral-400">Total PRs</div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Pull Requests</h2>
        <div className="xs:flex-row xs:gap-2 flex w-full gap-2 sm:w-auto">
          <Select value={sortBy} onValueChange={(value: string) => setSortBy(value)}>
            <SelectTrigger className="xs:w-[140px] w-full rounded-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="left-0 rounded-none">
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="impact">By Status</SelectItem>
              <SelectItem value="discussion">Last Updated</SelectItem>
              <SelectItem value="fastest">Fastest Merged</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedState} onValueChange={(value: string) => setSelectedState(value)}>
            <SelectTrigger className="xs:w-[140px] w-full rounded-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="left-0 rounded-none">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="merged">Merged</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {sortedPullRequests.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mb-4 text-neutral-400">
            <GitFork className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>No {selectedState !== 'all' ? selectedState : ''} pull requests found</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedPullRequests.map((pr) => {
            // const score = calculatePRScore(pr);
            const isMergedQuickly =
              pr.mergedAt &&
              new Date(pr.mergedAt).getTime() - new Date(pr.createdAt).getTime() <
                3 * 24 * 60 * 60 * 1000;

            return (
              <Card
                key={pr.id}
                className={cn(
                  'rounded-none border-neutral-800 bg-neutral-900/50 transition-colors hover:bg-neutral-900/70',
                  isMergedQuickly && 'border-green-900/50',
                )}
              >
                <CardContent className="px-4 py-0">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Link
                          href={pr.url}
                          target="_blank"
                          className="hover:text-primary text-base font-medium"
                        >
                          {pr.title}
                        </Link>
                        <Badge
                          variant={
                            pr.state === 'open' ? 'default' : pr.mergedAt ? 'secondary' : 'outline'
                          }
                          className={cn(
                            'rounded-none text-xs',
                            pr.state === 'open' &&
                              'border-green-800 bg-green-900/20 text-green-400',
                            pr.mergedAt && 'border-purple-800 bg-purple-900/20 text-purple-400',
                            pr.state === 'closed' &&
                              !pr.mergedAt &&
                              'border-red-800 bg-red-900/20 text-red-400',
                          )}
                        >
                          {pr.mergedAt ? 'Merged' : pr.state}
                        </Badge>
                        {pr.isDraft && (
                          <Badge variant="outline" className="rounded-none text-xs">
                            Draft
                          </Badge>
                        )}
                        {isMergedQuickly && (
                          <Badge className="rounded-none border-green-800 bg-green-900/20 text-xs text-green-400">
                            <Clock className="mr-1 h-3 w-3" />
                            Quick Merge
                          </Badge>
                        )}
                      </div>
                      <div className="mb-1 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center text-sm text-neutral-400">
                          <Link
                            href={pr.repository.url}
                            target="_blank"
                            className="hover:text-neutral-200"
                          >
                            {pr.repository.nameWithOwner}
                          </Link>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-neutral-400 sm:mt-0">
                          <span className="flex items-center gap-1">
                            <Icons.clock className="h-3 w-3" />
                            {new Date(pr.createdAt).toLocaleDateString()}
                          </span>
                          {pr.mergedAt && (
                            <span className="flex items-center gap-1">
                              <Icons.merge className="h-3 w-3" />
                              {new Date(pr.mergedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      {pr.headRefName && (
                        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-neutral-500">
                          <div className="flex items-center gap-2">
                            <code className="rounded-none bg-neutral-800 px-1.5 py-0.5">
                              {pr.headRefName}
                            </code>
                            <span>→</span>
                            <code className="rounded-none bg-neutral-800 px-1.5 py-0.5">
                              {pr.baseRefName}
                            </code>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={pr.url} target="_blank">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      )}
                      {!pr.headRefName && (
                        <div className="mt-2 flex justify-end">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={pr.url} target="_blank">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProfileSidebarSkeleton() {
  return (
    <Card className="rounded-none border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
      <CardContent className="px-6">
        <div className="text-center">
          <Skeleton className="mx-auto mb-4 h-24 w-24 rounded-none" />
          <Skeleton className="mx-auto mb-2 h-7 w-40 rounded-none" />
          <Skeleton className="mx-auto mb-4 h-5 w-60 rounded-none" />

          <div className="mb-4 flex items-center justify-center space-x-2 text-sm text-neutral-400">
            <Skeleton className="h-4 w-4 rounded-none" />
            <Skeleton className="h-4 w-20 rounded-none" />
          </div>

          <div className="mb-6 flex items-center justify-center space-x-2 text-sm text-neutral-400">
            <Skeleton className="h-4 w-4 rounded-none" />
            <Skeleton className="h-4 w-28 rounded-none" />
          </div>

          <div className="mb-6 flex justify-center space-x-3">
            <Skeleton className="h-9 w-9 rounded-none" />
            <Skeleton className="h-9 w-9 rounded-none" />
            <Skeleton className="h-9 w-9 rounded-none" />
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <Skeleton className="h-7 w-12 rounded-none" />
              <Skeleton className="mt-1 h-3 w-12 rounded-none" />
            </div>
            <div>
              <Skeleton className="h-7 w-12 rounded-none" />
              <Skeleton className="mt-1 h-3 w-12 rounded-none" />
            </div>
            <div>
              <Skeleton className="h-7 w-12 rounded-none" />
              <Skeleton className="mt-1 h-3 w-12 rounded-none" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
