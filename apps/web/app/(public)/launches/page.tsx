'use client';

import {
  ArrowUp,
  Calendar,
  ExternalLink,
  MessageCircle,
  Share2,
  TrendingUp,
  Trophy,
  X,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { authClient } from '@workspace/auth/client';
import Icons from '@workspace/ui/components/icons';
import Link from '@workspace/ui/components/link';
import { useTRPC } from '@/hooks/use-trpc';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ProjectReport } from '@/components/project/project-report';

export default function LaunchesPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('today');
  const { data: session } = authClient.useSession();

  const { data: todayLaunches, isLoading: todayLoading } = useQuery(
    trpc.launches.getTodayLaunches.queryOptions({ limit: 50 }),
  );

  const { data: yesterdayLaunches, isLoading: yesterdayLoading } = useQuery(
    trpc.launches.getYesterdayLaunches.queryOptions({ limit: 50 }),
  );

  const voteMutation = useMutation({
    ...trpc.launches.voteProject.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.launches.getTodayLaunches.queryKey({ limit: 50 }),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.launches.getYesterdayLaunches.queryKey({ limit: 50 }),
      });
    },
    onError: () => {
      toast.error('Failed to vote. Please try again.');
    },
  });

  const handleVote = async (projectId: string) => {
    if (!session?.user) {
      toast.error('Please login to vote');
      return;
    }
    voteMutation.mutate({ projectId });
  };

  const handleShare = async (project: any) => {
    const url = `${window.location.origin}/launches/${project.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: project.name,
          text: project.tagline,
          url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleShareOnX = async (project: any) => {
    const url = `${window.location.origin}/launches/${project.id}`;
    const text = `Check out ${project.name} - ${project.tagline}`;
    const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(xUrl, '_blank');
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return { text: '1st Place', color: 'bg-yellow-500' };
    if (index === 1) return { text: '2nd Place', color: 'bg-gray-400' };
    if (index === 2) return { text: '3rd Place', color: 'bg-orange-600' };
    return null;
  };

  const FeaturedLaunch = ({ project }: { project: any }) => (
    <Card className="mb-8 overflow-hidden border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950">
      <CardContent className="p-0">
        <div className="flex items-center gap-2 border-b border-neutral-800 bg-yellow-500/10 px-6 py-3">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium text-yellow-500">FEATURED LAUNCH</span>
        </div>
        <div className="p-6">
          <div className="flex gap-6">
            <div className="flex-1">
              <Link href={`/launches/${project.id}`}>
                <h2 className="mb-2 text-2xl font-bold transition-colors hover:text-orange-500">
                  {project.name}
                </h2>
              </Link>
              <p className="mb-4 text-lg text-neutral-400">{project.tagline}</p>

              <div className="mb-6 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={project.owner?.image} />
                    <AvatarFallback>{project.owner?.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{project.owner?.name || 'Unknown'}</p>
                    <p className="text-xs text-neutral-400">
                      @{project.owner?.username || 'unknown'}
                    </p>
                  </div>
                </div>
                {project.type && (
                  <Badge variant="secondary" className="capitalize">
                    {project.type.replace('-', ' ')}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Link href={`/launches/${project.id}`}>
                  <Button variant="default" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Visit
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleShareOnX(project)}
                  className="gap-2"
                >
                  <Icons.twitter className="h-4 w-4" />
                </Button>
                <ProjectReport projectId={project.id} projectName={project.name} />
                <div className="ml-auto flex items-center gap-4">
                  <Button
                    variant={project.hasVoted ? 'default' : 'outline'}
                    className={`gap-2 ${
                      project.hasVoted ? 'bg-orange-500 hover:bg-orange-600' : ''
                    }`}
                    onClick={() => handleVote(project.id)}
                    disabled={voteMutation.isPending}
                  >
                    <ArrowUp className="h-4 w-4" />
                    <span className="font-semibold">{project.voteCount}</span>
                  </Button>
                  <div className="flex items-center gap-1 text-sm text-neutral-400">
                    <MessageCircle className="h-4 w-4" />
                    <span>{project.commentCount}</span>
                  </div>
                </div>
              </div>
            </div>
            {project.logoUrl && (
              <img
                src={project.logoUrl}
                alt={project.name}
                className="h-32 w-32 rounded-lg object-cover"
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ProjectCard = ({ project, index }: { project: any; index: number }) => {
    const rankBadge = getRankBadge(index);

    return (
      <Card className="transition-all duration-200 hover:border-neutral-700">
        <CardContent className="p-6">
          {rankBadge && (
            <div
              className={`mb-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-white ${rankBadge.color}`}
            >
              <Trophy className="h-3 w-3" />
              {rankBadge.text}
            </div>
          )}
          <div className="flex gap-4">
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl font-medium text-neutral-500">#{index + 1}</span>
              <Button
                variant={project.hasVoted ? 'default' : 'outline'}
                size="sm"
                className={`flex h-auto flex-col items-center gap-1 rounded-none border px-3 py-2 ${
                  project.hasVoted
                    ? 'border-orange-500 bg-orange-500 hover:border-orange-600 hover:bg-orange-600'
                    : ''
                }`}
                onClick={() => handleVote(project.id)}
                disabled={voteMutation.isPending}
              >
                <ArrowUp className="h-4 w-4" />
                <span className="text-xs font-semibold tabular-nums">{project.voteCount}</span>
              </Button>
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Link href={`/launches/${project.id}`}>
                    <h3 className="text-lg font-semibold transition-colors hover:text-orange-500">
                      {project.name}
                    </h3>
                  </Link>
                  <div className="mt-1 mb-2 flex items-center gap-2">
                    <span className="text-sm text-neutral-400">
                      by {project.owner?.name || 'Unknown'}
                    </span>
                    {project.owner?.username && (
                      <span className="text-sm text-neutral-500">@{project.owner.username}</span>
                    )}
                    {project.type && (
                      <>
                        <span className="text-neutral-600">•</span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {project.type.replace('-', ' ')}
                        </Badge>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-neutral-400">{project.tagline}</p>

                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex items-center gap-1 text-sm text-neutral-400">
                      <MessageCircle className="h-4 w-4" />
                      <span className="tabular-nums">{project.commentCount}</span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare(project)}
                      className="-m-2 text-neutral-400 hover:text-neutral-200"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShareOnX(project)}
                      className="-m-2 text-neutral-400 hover:text-neutral-200"
                    >
                      <Icons.twitter className="h-4 w-4" />
                    </Button>

                    <ProjectReport
                      projectId={project.id}
                      projectName={project.name}
                    />
                  </div>

                  {project.tags && project.tags.length > 0 && (
                    <div className="mt-3 flex gap-2">
                      {project.tags.slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {project.logoUrl && (
                  <img
                    src={project.logoUrl}
                    alt={project.name}
                    className="ml-4 h-16 w-16 rounded-lg object-cover"
                  />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Product Launches</h1>
        <p className="text-neutral-400">
          Discover and support the latest open source projects launching on OSS Now
        </p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-6 grid w-full grid-cols-2">
          <TabsTrigger value="today" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Today
          </TabsTrigger>
          <TabsTrigger value="yesterday" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Yesterday
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          {todayLoading ? (
            <div className="py-12 text-center">
              <p className="text-neutral-400">Loading today's launches...</p>
            </div>
          ) : todayLaunches && todayLaunches.length > 0 ? (
            <>
              {todayLaunches[0] && <FeaturedLaunch project={todayLaunches[0]} />}
              {todayLaunches.slice(1).map((project, index) => (
                <ProjectCard key={project.id} project={project} index={index + 1} />
              ))}
            </>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-neutral-400">No launches today yet.</p>
              <p className="mt-2 text-sm text-neutral-500">Be the first to launch your project!</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="yesterday" className="space-y-4">
          {yesterdayLoading ? (
            <div className="py-12 text-center">
              <p className="text-neutral-400">Loading yesterday's launches...</p>
            </div>
          ) : yesterdayLaunches && yesterdayLaunches.length > 0 ? (
            <>
              {yesterdayLaunches[0] && <FeaturedLaunch project={yesterdayLaunches[0]} />}
              {yesterdayLaunches.slice(1).map((project, index) => (
                <ProjectCard key={project.id} project={project} index={index + 1} />
              ))}
            </>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-neutral-400">No launches yesterday.</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
