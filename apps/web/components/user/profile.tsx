'use client';

import {
  Award,
  Calendar,
  Clock,
  ExternalLink,
  GitFork,
  Globe,
  Heart,
  MapPin,
  Share,
  TrendingUp,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import ProjectCard from '@/app/(public)/(projects)/projects/project-card';
import ResponsiveNumber from '@/components/user/responsive-numbers';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
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

interface ContributionDay {
  date: Date;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

function ContributionGraph({
  username,
  provider,
}: {
  username: string;
  provider: 'github' | 'gitlab';
}) {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.profile.getUserContributions.queryOptions({
      username,
      provider,
    }),
  );

  const contributions: ContributionDay[] =
    data?.days.map((day) => ({
      date: new Date(day.date),
      count: day.contributionCount,
      level: (() => {
        switch (day.contributionLevel) {
          case 'NONE':
            return 0;
          case 'FIRST_QUARTILE':
            return 1;
          case 'SECOND_QUARTILE':
            return 2;
          case 'THIRD_QUARTILE':
            return 3;
          case 'FOURTH_QUARTILE':
            return 4;
          default:
            return 0;
        }
      })(),
    })) || [];

  const getContributionGrid = () => {
    const grid: (ContributionDay | null)[][] = [];
    if (contributions.length === 0) return grid;

    const firstDay = contributions[0];
    if (!firstDay) return grid;

    const firstDayOfWeek = firstDay.date.getDay();

    for (let i = 0; i < 7; i++) {
      grid.push([]);
    }

    for (let i = 0; i < firstDayOfWeek; i++) {
      if (grid[i]) {
        grid[i]?.push(null);
      }
    }

    contributions.forEach((day) => {
      const dayOfWeek = day.date.getDay();
      if (grid[dayOfWeek]) {
        grid[dayOfWeek].push(day);
      }
    });

    const maxWeeks = Math.max(...grid.map((row) => row.length));
    grid.forEach((row) => {
      while (row.length < maxWeeks) {
        row.push(null);
      }
    });

    return grid;
  };

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const grid = getContributionGrid();
  const weeks = grid.length > 0 && grid[0] ? grid[0].length : 0;

  const getMonthColumns = () => {
    const monthCols: { month: string; colspan: number; index: number }[] = [];
    let currentMonth = -1;
    let startWeek = 0;

    for (let week = 0; week < weeks; week++) {
      let monthForWeek = -1;
      for (let day = 0; day < 7; day++) {
        const contribution = grid[day]?.[week];
        if (contribution) {
          monthForWeek = contribution.date.getMonth();
          break;
        }
      }

      if (monthForWeek !== -1 && monthForWeek !== currentMonth) {
        if (currentMonth !== -1) {
          monthCols.push({
            month: months[currentMonth] || '',
            colspan: week - startWeek,
            index: monthCols.length,
          });
        }
        currentMonth = monthForWeek;
        startWeek = week;
      }
    }

    if (currentMonth !== -1) {
      monthCols.push({
        month: months[currentMonth] || '',
        colspan: weeks - startWeek,
        index: monthCols.length,
      });
    }

    return monthCols;
  };

  const levelColors = [
    'bg-neutral-800',
    'bg-blue-900/50',
    'bg-blue-800/70',
    'bg-blue-700',
    'bg-blue-600',
  ];

  if (isLoading) {
    return (
      <Card className="rounded-none border-neutral-800 bg-neutral-900/50 p-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-8">
            <div className="text-neutral-400">Loading contribution graph...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none border-neutral-800 bg-neutral-900/50 p-0">
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-medium text-neutral-300">Contribution Activity</div>
          {data && (
            <div className="text-xs text-neutral-400">
              {data.totalContributions.toLocaleString()} contributions in the last year
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table
            className="border-separate"
            style={{ borderSpacing: '3px' }}
            role="grid"
            aria-readonly="true"
          >
            <caption className="sr-only">Contribution Graph</caption>
            <thead>
              <tr style={{ height: '13px' }}>
                <td style={{ width: '28px' }}>
                  <span className="sr-only">Day of Week</span>
                </td>
                {getMonthColumns().map((col) => (
                  <td
                    key={col.index}
                    className="relative text-xs text-neutral-400"
                    colSpan={col.colspan}
                  >
                    <span className="sr-only">{col.month}</span>
                    <span aria-hidden="true" className="absolute top-0 left-0">
                      {col.month}
                    </span>
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              {weekDays.map((dayName, dayIndex) => (
                <tr key={dayIndex} style={{ height: '10px' }}>
                  <td
                    className="relative pr-1 text-right text-xs text-neutral-400"
                    style={{ width: '28px' }}
                  >
                    <span className="sr-only">{dayName}</span>
                    <span
                      aria-hidden="true"
                      className={cn('absolute right-1', dayIndex % 2 === 0 && 'opacity-0')}
                    >
                      {dayName.slice(0, 3)}
                    </span>
                  </td>
                  {Array.from({ length: weeks }).map((_, weekIndex) => {
                    const day = grid[dayIndex]?.[weekIndex];
                    return (
                      <td
                        key={weekIndex}
                        className={cn('h-[10px] w-[10px]', day ? levelColors[day.level] : '')}
                        style={{ width: '10px' }}
                        title={
                          day ? `${day.count} contributions on ${day.date.toDateString()}` : ''
                        }
                        role="gridcell"
                        aria-selected="false"
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 flex items-center justify-end gap-1 text-xs text-neutral-400">
            <span>Less</span>
            {levelColors.map((color, i) => (
              <div key={i} className={cn('h-[10px] w-[10px]', color)} />
            ))}
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
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
    <div className="relative px-6 pt-8">
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
              <div className="sticky top-[calc(32px+66px+16px)]">
                {isProfileLoading ? (
                  <ProfileSidebarSkeleton />
                ) : (
                  <Card className="rounded-none border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
                    <CardContent className="px-6">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-16 w-16 flex-shrink-0 rounded-none">
                          <AvatarImage src={profile?.image} />
                          <AvatarFallback>
                            {profile?.name?.charAt(0).toUpperCase() ?? 'U'}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <h1 className="truncate text-lg font-bold">{profile?.name}</h1>

                            <div className="flex items-center gap-1">
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

                              {profile?.git?.blog && (
                                <Button variant="ghost" size="sm" asChild>
                                  <Link href={profile?.git?.blog} target="_blank">
                                    <Globe className="h-4 w-4" />
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="mt-1 flex items-center justify-between text-sm text-neutral-400">
                            {profile?.git?.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{profile?.git?.location}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {profile?.git?.createdAt &&
                                  new Date(profile.git.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-3 gap-4 border-t border-neutral-800 pt-4">
                        <div className="text-center">
                          <div className="text-lg font-bold">
                            {(projectsWithGithubData?.length || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-neutral-400">Projects</div>
                        </div>
                        <div className="text-center">
                          <ResponsiveNumber
                            value={
                              projectsWithGithubData?.reduce((sum, p) => sum + p.stars, 0) || 0
                            }
                            className="text-lg font-bold"
                          />
                          <div className="text-xs text-neutral-400">Stars</div>
                        </div>
                        <div className="text-center">
                          <ResponsiveNumber
                            value={
                              projectsWithGithubData?.reduce((sum, p) => sum + p.forks, 0) || 0
                            }
                            className="text-lg font-bold"
                          />
                          <div className="text-xs text-neutral-400">Forks</div>
                        </div>
                      </div>

                      <div className="mt-5 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 rounded-none border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:border-neutral-700 hover:bg-neutral-800 hover:text-neutral-200"
                          // TODO: Implement share functionality
                          // Add Web Share API with clipboard fallback
                        >
                          <Share className="mr-2 h-4 w-4" />
                          Share
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 rounded-none border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:border-neutral-700 hover:bg-neutral-800 hover:text-neutral-200"
                          // TODO: Implement endorse functionality
                          // Add endorse/profile recommendation feature
                        >
                          <Award className="mr-2 h-4 w-4" />
                          Endorse
                        </Button>
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
            </div>

            <div className="space-y-4 lg:col-span-8">
              {isProfileLoading && (
                <Card className="rounded-none border-neutral-800 bg-neutral-900/50 p-0">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-center py-8">
                      <div className="text-neutral-400">Loading contribution graph...</div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {!isProfileLoading && profile?.git && (
                <ContributionGraph username={profile.git.login} provider={profile.git.provider} />
              )}
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

                <TabsContent value="projects" className="mt-2">
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
                    <div className="space-y-4">
                      {projectsWithGithubData?.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="contributions" className="mt-2">
                  <UserPullRequests profile={profile as Profile} />
                </TabsContent>

                <TabsContent value="collections" className="mt-2">
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
          <Card key={i} className="rounded-none border-neutral-800 bg-neutral-900/50 p-0">
            <CardContent className="p-4">
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
        <Card className="rounded-none border-neutral-800 bg-neutral-900/50 p-0">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.merged}</div>
            <div className="text-xs text-neutral-400">Merged PRs</div>
          </CardContent>
        </Card>
        <Card className="rounded-none border-neutral-800 bg-neutral-900/50 p-0">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.open}</div>
            <div className="text-xs text-neutral-400">Open PRs</div>
          </CardContent>
        </Card>
        <Card className="rounded-none border-neutral-800 bg-neutral-900/50 p-0">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.avgMergeTime}d</div>
            <div className="text-xs text-neutral-400">Avg Merge Time</div>
          </CardContent>
        </Card>
        <Card className="rounded-none border-neutral-800 bg-neutral-900/50 p-0">
          <CardContent className="p-4">
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
                  'rounded-none border-neutral-800 bg-neutral-900/50 p-0 transition-colors hover:bg-neutral-900/70',
                  isMergedQuickly && 'border-green-900/50',
                )}
              >
                <CardContent className="p-4">
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
        <div className="flex items-start gap-3">
          <Skeleton className="h-16 w-16 flex-shrink-0 rounded-none" />

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32 rounded-none" />
              <div className="flex items-center gap-1">
                <Skeleton className="h-8 w-8 rounded-none" />
                <Skeleton className="h-8 w-8 rounded-none" />
              </div>
            </div>

            <div className="mt-1 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Skeleton className="h-3 w-3 rounded-none" />
                <Skeleton className="h-4 w-20 rounded-none" />
              </div>
              <div className="flex items-center gap-1">
                <Skeleton className="h-3 w-3 rounded-none" />
                <Skeleton className="h-4 w-16 rounded-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-neutral-800 pt-4">
          <div className="text-center">
            <Skeleton className="mx-auto h-7 w-12 rounded-none" />
            <Skeleton className="mx-auto mt-1 h-3 w-12 rounded-none" />
          </div>
          <div className="text-center">
            <Skeleton className="mx-auto h-7 w-12 rounded-none" />
            <Skeleton className="mx-auto mt-1 h-3 w-12 rounded-none" />
          </div>
          <div className="text-center">
            <Skeleton className="mx-auto h-7 w-12 rounded-none" />
            <Skeleton className="mx-auto mt-1 h-3 w-12 rounded-none" />
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <Skeleton className="h-9 flex-1 rounded-none" />
          <Skeleton className="h-9 flex-1 rounded-none" />
        </div>
      </CardContent>
    </Card>
  );
}
