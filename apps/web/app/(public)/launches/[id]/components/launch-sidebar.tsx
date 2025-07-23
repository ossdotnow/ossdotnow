'use client';

import {
  AlertCircle,
  ArrowUp,
  ExternalLink,
  GitFork,
  GitPullRequest,
  Star,
  Users,
} from 'lucide-react';
import { Separator } from '@workspace/ui/components/separator';
import { useMutation, useQuery } from '@tanstack/react-query';
import { projectProviderEnum } from '@workspace/db/schema';
import { Button } from '@workspace/ui/components/button';
import { authClient } from '@workspace/auth/client';
import Link from '@workspace/ui/components/link';
import { formatDistanceToNow } from 'date-fns';
import { useTRPC } from '@/hooks/use-trpc';
import { toast } from 'sonner';
import { useRouter, usePathname } from 'next/navigation';

const isValidProvider = (
  provider: string | null | undefined,
): provider is (typeof projectProviderEnum.enumValues)[number] => {
  return provider === 'github' || provider === 'gitlab';
};

interface LaunchSidebarProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  launch: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  project: any;
  projectId: string;
}

export default function LaunchSidebar({ launch, project, projectId }: LaunchSidebarProps) {
  const { data: session } = authClient.useSession();
  const trpc = useTRPC();

  const router = useRouter();
  const currentPath = usePathname();

  // Validate gitRepoUrl and gitHost before using them in queries
  const isValidRepoUrl = Boolean(project?.gitRepoUrl && project.gitRepoUrl.trim() !== '');
  const isValidGitHost = isValidProvider(project?.gitHost);

  // Fetch repository data
  const repoQuery = useQuery(
    trpc.repository.getRepo.queryOptions(
      {
        url: project?.gitRepoUrl as string,
        provider: project?.gitHost as (typeof projectProviderEnum.enumValues)[number],
      },
      {
        enabled: isValidRepoUrl && isValidGitHost,
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
        enabled: !!repoQuery.data && isValidRepoUrl && isValidGitHost,
        retry: false,
      },
    ),
  );

  const voteMutation = useMutation({
    ...trpc.launches.voteProject.mutationOptions(),
    onSuccess: () => {
      toast.success('Vote recorded!');
    },
    onError: () => {
      toast.error('Failed to vote. Please try again.');
    },
  });

  const handleVote = async () => {
    if (!session?.user) {
      await router.push(`/login?redirect=${currentPath}`);
      toast.error('Please login to vote');
      return;
    }
    voteMutation.mutate({ projectId });
  };

  const repoData = repoQuery.data;
  const repoStats = repoDataQuery.data;
  const contributors = repoStats?.contributors;
  const issuesCount = repoStats?.issuesCount || 0;
  const pullRequestsCount = repoStats?.pullRequestsCount || 0;

  return (
    <div className="flex flex-col gap-4 lg:col-span-1">
      {/* Main Info Card */}
      <div className="border border-neutral-800 bg-neutral-900/50 p-4 md:p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Launch Info</h2>

        {/* Vote Button */}
        <div className="mb-6">
          <Button
            variant={launch.hasVoted ? 'default' : 'outline'}
            size="lg"
            className={`flex h-12 w-full items-center justify-center gap-3 rounded-none ${
              launch.hasVoted ? 'bg-orange-500 hover:bg-orange-600' : ''
            }`}
            onClick={handleVote}
            disabled={voteMutation.isPending}
          >
            <ArrowUp className="h-5 w-5" />
            <span className="text-xl font-bold">{launch.voteCount}</span>
            <span className="text-sm">VOTES</span>
          </Button>
        </div>

        <div className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-neutral-300">Details</h3>
          <div className="space-y-2 text-sm">
            {launch.launchDate && (
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Launch Date</span>
                <span className="text-neutral-300">
                  {formatDistanceToNow(new Date(launch.launchDate))} ago
                </span>
              </div>
            )}
            {launch.owner?.name && (
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Owner</span>
                <span className="text-neutral-300">{launch.owner.name}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Status</span>
              <span className="text-neutral-300">Active Launch</span>
            </div>
          </div>
        </div>

        <Separator className="my-6 bg-neutral-700/40" />

        <div className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-neutral-300">Repository Stats</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-400">
                <Star className="h-4 w-4" />
                <span className="text-sm">Stars</span>
              </div>
              <span className="text-sm font-medium">
                {repoData?.stargazers_count || repoData?.star_count || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-400">
                <GitFork className="h-4 w-4" />
                <span className="text-sm">Forks</span>
              </div>
              <span className="text-sm font-medium">{repoData?.forks_count || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-400">
                <Users className="h-4 w-4" />
                <span className="text-sm">Contributors</span>
              </div>
              <span className="text-sm font-medium">{contributors?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Open Issues</span>
              </div>
              <span className="text-sm font-medium">{issuesCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-400">
                <GitPullRequest className="h-4 w-4" />
                <span className="text-sm">Open PRs</span>
              </div>
              <span className="text-sm font-medium">{pullRequestsCount}</span>
            </div>
          </div>
        </div>

        {/* Tags */}
        {launch.tags && launch.tags.length > 0 && (
          <>
            <Separator className="my-6 bg-neutral-700/40" />
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-medium text-neutral-300">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {launch.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-none bg-neutral-800 px-2.5 py-1 text-xs text-neutral-300 transition-colors hover:bg-neutral-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        <div>
          <Button variant="outline" className="w-full gap-2 rounded-none" asChild>
            <Link href={`/projects/${projectId}`}>
              <ExternalLink className="h-4 w-4" />
              View Project
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
