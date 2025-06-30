'use client';

import {
  Calendar,
  Clock,
  ExternalLink,
  GitFork,
  Globe,
  Heart,
  MapPin,
  MessageCircle,
  Star,
  TrendingUp,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import Icons from '@workspace/ui/components/icons';
import { RecentActivity } from './recent-activity';
import Link from '@workspace/ui/components/link';
import { useTRPC } from '@/hooks/use-trpc';
import Image from 'next/image';

export default function ProfilePage({ id }: { id: string }) {
  const trpc = useTRPC();

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
  const featuredProjects = [] as any[];

  return (
    <div className="mx-auto min-h-[calc(100vh-80px)] max-w-[1080px] pt-10">
      <div className="relative z-10">
        <div className="container mx-auto py-8">
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
                      <p className="mb-4 text-neutral-400">
                        Full-stack developer & Open source enthusiast
                      </p>

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
                          <div className="text-2xl font-bold">
                            {(
                              projectsWithGithubData?.reduce((sum, p) => sum + p.stars, 0) || 0
                            ).toLocaleString()}
                          </div>
                          <div className="text-xs text-neutral-400">Total Stars</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">
                            {(
                              projectsWithGithubData?.reduce((sum, p) => sum + p.forks, 0) || 0
                            ).toLocaleString()}
                          </div>
                          <div className="text-xs text-neutral-400">Total Forks</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {profile?.id && <RecentActivity userId={profile.id} />}
            </div>

            <div className="lg:col-span-8">
              <Tabs defaultValue="projects" className="w-full">
                <TabsList className="grid w-full grid-cols-3 border-neutral-800 bg-neutral-900/50">
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                  <TabsTrigger value="contributions">Contributions</TabsTrigger>
                  <TabsTrigger value="collections">Collections</TabsTrigger>
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
                            <Card
                              key={project.id}
                              className="h-48 min-w-[320px] rounded-none border-neutral-800 bg-neutral-900/50 pb-0 backdrop-blur-sm transition-all duration-200 hover:bg-neutral-900/70"
                            >
                              <CardContent className="flex h-full flex-col p-4">
                                <div className="flex flex-1 space-x-4">
                                  <div className="flex-shrink-0">
                                    <div className="h-16 w-16 overflow-hidden bg-white">
                                      <Image
                                        src={
                                          project.githubData?.owner.avatar_url || '/placeholder.svg'
                                        }
                                        alt={project.name}
                                        width={64}
                                        height={64}
                                        className="h-full w-full object-contain"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                                    <div>
                                      <div className="mb-1 flex items-center justify-between">
                                        <h3 className="truncate pr-2 text-lg font-semibold">
                                          {project.name}
                                        </h3>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge className="bg-orange-500 text-xs hover:bg-orange-600">
                                          {project.approvalStatus}
                                        </Badge>
                                        {project.language && (
                                          <Badge className="bg-neutral-700 text-xs hover:bg-neutral-600">
                                            {project.language}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between border-neutral-800/50 pt-3 text-sm text-neutral-400">
                                  <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-1">
                                      <Star className="h-4 w-4" />
                                      <span>{project.stars.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <GitFork className="h-4 w-4" />
                                      <span>{project.forks.toLocaleString()}</span>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(project.gitRepoUrl, '_blank')}
                                    className="transition-colors duration-150 hover:text-neutral-200"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
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
                        <Card
                          key={project.id}
                          className="rounded-none border-neutral-800 bg-neutral-900/50 backdrop-blur-sm transition-all duration-200 hover:bg-neutral-900/70"
                        >
                          <CardContent className="px-6">
                            <div className="flex items-start space-x-4">
                              <Image
                                src={project.githubData?.owner.avatar_url || '/placeholder.svg'}
                                alt={project.name}
                                width={80}
                                height={80}
                                className="h-20 w-20 flex-shrink-0 object-cover"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="mb-2 flex items-start justify-between">
                                  <div>
                                    <h3 className="mb-1 text-lg font-semibold">{project.name}</h3>
                                    <div className="mb-2 flex items-center gap-2">
                                      <Badge variant="secondary" className="text-xs">
                                        {project.approvalStatus}
                                      </Badge>
                                      {project.language && (
                                        <Badge variant="outline" className="text-xs">
                                          {project.language}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <p className="mb-3 text-sm text-neutral-400">
                                  {project.description}
                                </p>

                                <div className="mb-3 flex flex-wrap gap-2">
                                  {project.tags?.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4 text-sm text-neutral-400">
                                    <div className="flex items-center space-x-1">
                                      <Star className="h-4 w-4" />
                                      <span>{project.stars.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <GitFork className="h-4 w-4" />
                                      <span>{project.forks.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Clock className="h-4 w-4" />
                                      <span>{project.lastCommit}</span>
                                    </div>
                                    {project.openIssues > 0 && (
                                      <div className="flex items-center space-x-1">
                                        <MessageCircle className="h-4 w-4" />
                                        <span>{project.openIssues}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="transition-colors duration-150 hover:text-neutral-200"
                                    >
                                      <Heart className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      asChild
                                      className="transition-colors duration-150 hover:text-neutral-200"
                                    >
                                      <Link
                                        href={`https://${project.gitHost}.com/${project.gitRepoUrl}`}
                                        target="_blank"
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </Link>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="contributions" className="mt-6">
                  <div className="py-12 text-center">
                    <div className="mb-4 text-neutral-400">
                      <Icons.github className="mx-auto mb-4 h-12 w-12 opacity-50" />
                      <p>Contribution history coming soon...</p>
                    </div>
                  </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileSidebarSkeleton() {
  return (
    <Card className="rounded-none border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
      <CardContent className="px-6">
        <div className="text-center">
          <Skeleton className="mx-auto mb-4 h-24 w-24 rounded-full" />
          <Skeleton className="mx-auto mb-2 h-7 w-40" />
          <Skeleton className="mx-auto mb-4 h-5 w-60" />

          <div className="mb-4 flex items-center justify-center space-x-2 text-sm text-neutral-400">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
          </div>

          <div className="mb-6 flex items-center justify-center space-x-2 text-sm text-neutral-400">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-28" />
          </div>

          <div className="mb-6 flex justify-center space-x-3">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <Skeleton className="h-7 w-12" />
              <Skeleton className="mt-1 h-3 w-12" />
            </div>
            <div>
              <Skeleton className="h-7 w-12" />
              <Skeleton className="mt-1 h-3 w-12" />
            </div>
            <div>
              <Skeleton className="h-7 w-12" />
              <Skeleton className="mt-1 h-3 w-12" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
