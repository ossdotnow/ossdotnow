'use client';

import {
  Star,
  GitFork,
  Clock,
  ExternalLink,
  Github,
  Twitter,
  Globe,
  ArrowUp,
  MessageCircle,
  Heart,
  TrendingUp,
  Calendar,
  MapPin,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import { Card, CardContent, CardHeader } from '@workspace/ui/components/card';
import { useQuery, useQueries } from '@tanstack/react-query';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { useTRPC } from '@/hooks/use-trpc';
import { useState } from 'react';
import Image from 'next/image';

export default function ProfilePage({ id }: { id: string }) {
  const trpc = useTRPC();
  const [votedProjects, setVotedProjects] = useState<Set<string>>(new Set());

  const handleVote = (projectId: string) => {
    setVotedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const activities = [
    {
      type: 'project',
      action: 'launched',
      target: 'ReactFlow v2.0',
      time: '2 hours ago',
      votes: 45,
    },
    {
      type: 'vote',
      action: 'upvoted',
      target: 'Supabase Dashboard',
      time: '1 day ago',
      votes: 12,
    },
    {
      type: 'comment',
      action: 'commented on',
      target: 'Next.js 14 Discussion',
      time: '3 days ago',
      votes: 8,
    },
  ];

  const { data: user } = useQuery(trpc.user.get.queryOptions(id));
  const { data: githubDetails } = useQuery(trpc.profile.githubDetails.queryOptions());
  const { data: projects } = useQuery(
    trpc.projects.getProjects.queryOptions({
      approvalStatus: 'all',
      page: 1,
      pageSize: 100,
    }),
  );

  // if the id is me then

  // const { data: contributions } = useQuery(
  //   trpc.user.getContributions.queryOptions({
  //     ownerId: ,
  //   }),
  // );

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

  return (
    <div className="min-h-[calc(100vh-80px)] px-6">
      <div className="relative z-10">
        <div className="container mx-auto py-8">
          <div className="grid gap-8 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <Card className="rounded-none border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
                <CardContent className="px-6">
                  <div className="text-center">
                    <Avatar className="mx-auto mb-4 h-24 w-24">
                      <AvatarImage src="/placeholder.svg?height=96&width=96" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <h1 className="mb-2 text-2xl font-bold">{user?.name}</h1>
                    <p className="mb-4 text-neutral-400">
                      Full-stack developer & Open source enthusiast
                    </p>

                    <div className="mb-4 flex items-center justify-center space-x-2 text-sm text-neutral-400">
                      <MapPin className="h-4 w-4" />
                      <span>{githubDetails?.location}</span>
                    </div>

                    <div className="mb-6 flex items-center justify-center space-x-2 text-sm text-neutral-400">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {new Date(githubDetails?.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="mb-6 flex justify-center space-x-3">
                      <Button variant="ghost" size="sm">
                        <Github className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Twitter className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Globe className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold">
                          {projectsWithGithubData?.length || 0}
                        </div>
                        <div className="text-xs text-neutral-400">Projects</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {projectsWithGithubData?.reduce((sum, p) => sum + p.stars, 0) || 0}
                        </div>
                        <div className="text-xs text-neutral-400">Total Stars</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {projectsWithGithubData?.reduce((sum, p) => sum + p.forks, 0) || 0}
                        </div>
                        <div className="text-xs text-neutral-400">Total Forks</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6 rounded-none border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
                <CardHeader>
                  <h3 className="text-lg font-semibold">Recent Activity</h3>
                </CardHeader>
                <CardContent className="px-6">
                  <div className="space-y-4">
                    {activities.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-none bg-orange-500" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm">
                            <span className="text-neutral-400">{activity.action}</span>{' '}
                            <span className="font-medium text-white">{activity.target}</span>
                          </p>
                          <div className="mt-1 flex items-center space-x-2">
                            <span className="text-xs text-neutral-500">{activity.time}</span>
                            <div className="flex items-center space-x-1">
                              <ArrowUp className="h-3 w-3 text-orange-500" />
                              <span className="text-xs text-neutral-400">{activity.votes}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3">
              <Tabs defaultValue="projects" className="w-full">
                <TabsList className="grid w-full grid-cols-3 border-neutral-800 bg-neutral-900/50">
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                  <TabsTrigger value="contributions">Contributions</TabsTrigger>
                  <TabsTrigger value="collections">Collections</TabsTrigger>
                </TabsList>

                <TabsContent value="projects" className="mt-6">
                  <div className="mb-8">
                    <h2 className="mb-4 flex items-center text-xl font-semibold">
                      <TrendingUp className="mr-2 h-5 w-5 text-orange-500" />
                      Featured Projects
                    </h2>
                    <div className="grid gap-6 md:grid-cols-2">
                      {projectsWithGithubData?.slice(0, 2).map((project) => (
                        <Card
                          key={project.id}
                          className="rounded-none border-neutral-800 bg-neutral-900/50 pt-0 backdrop-blur-sm transition-all duration-200 hover:bg-neutral-900/70"
                        >
                          <div className="relative">
                            <Image
                              src={project.githubData?.owner.avatar_url || '/placeholder.svg'}
                              alt={project.name}
                              width={400}
                              height={200}
                              className="h-48 w-full object-cover"
                            />
                            <Badge className="absolute top-3 left-3 bg-orange-500 hover:bg-orange-600">
                              {project.approvalStatus}
                            </Badge>
                            {project.language && (
                              <Badge className="absolute top-3 right-3 bg-neutral-700 hover:bg-neutral-600">
                                {project.language}
                              </Badge>
                            )}
                          </div>
                          <CardContent className="p-0">
                            <div className="px-6">
                              <div className="mb-3 flex items-start justify-between">
                                <h3 className="text-lg font-semibold">{project.name}</h3>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleVote(project.id)}
                                  className={`flex items-center space-x-1 ${
                                    votedProjects.has(project.id)
                                      ? 'bg-orange-500/10 text-orange-500'
                                      : 'text-neutral-400 hover:text-orange-500'
                                  }`}
                                >
                                  <ArrowUp className="h-4 w-4" />
                                  <span className="text-sm font-medium">{project.stars}</span>
                                </Button>
                              </div>
                              <p className="mb-4 line-clamp-2 text-sm text-neutral-400">
                                {project.description}
                              </p>

                              <div className="mb-4 flex flex-wrap gap-2">
                                {project.tags?.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>

                              <div className="flex items-center justify-between text-sm text-neutral-400">
                                <div className="flex items-center space-x-4">
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
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(project.gitRepoUrl, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

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
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleVote(project.id)}
                                    className={`flex items-center space-x-1 ${
                                      votedProjects.has(project.id)
                                        ? 'bg-orange-500/10 text-orange-500'
                                        : 'text-neutral-400 hover:text-orange-500'
                                    }`}
                                  >
                                    <ArrowUp className="h-4 w-4" />
                                    <span className="text-sm font-medium">{project.stars}</span>
                                  </Button>
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
                                    <Button variant="ghost" size="sm">
                                      <Heart className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => window.open(project.gitRepoUrl, '_blank')}
                                    >
                                      <ExternalLink className="h-4 w-4" />
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
                      <Github className="mx-auto mb-4 h-12 w-12 opacity-50" />
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
