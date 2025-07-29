'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import {
  AlertCircle,
  ArrowUp,
  ExternalLink,
  GitFork,
  GitPullRequest,
  Star,
  Users,
  Trash2,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Separator } from '@workspace/ui/components/separator';
import { projectProviderEnum } from '@workspace/db/schema';
import { Button } from '@workspace/ui/components/button';
import { useRouter, usePathname } from 'next/navigation';
import { Input } from '@workspace/ui/components/input';
import { authClient } from '@workspace/auth/client';
import Link from '@workspace/ui/components/link';
import { formatDistanceToNow } from 'date-fns';
import { useTRPC } from '@/hooks/use-trpc';
import { useState } from 'react';
import { toast } from 'sonner';

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
  const queryClient = useQueryClient();

  const router = useRouter();
  const currentPath = usePathname();
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');

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
      // Refetch launch data to update vote count
      queryClient.invalidateQueries({
        queryKey: trpc.launches.getLaunchByProjectId.queryKey({ projectId }),
      });
    },
    onError: () => {
      toast.error('Failed to vote. Please try again.');
    },
  });

  const removeLaunchMutation = useMutation({
    ...trpc.launches.removeLaunch.mutationOptions(),
    onSuccess: () => {
      toast.success('Launch removed successfully!');
      router.push('/launches');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove launch. Please try again.');
    },
  });

  const handleVote = async () => {
    if (!session?.user) {
      router.push(`/login?redirect=${currentPath}`);
      toast.error('Please login to vote');
      return;
    }
    voteMutation.mutate({ projectId });
  };

  const handleRemoveLaunch = () => {
    setShowRemoveModal(true);
  };

  const handleConfirmRemoval = () => {
    const projectName = getProjectName();
    if (confirmationInput === projectName) {
      removeLaunchMutation.mutate({ projectId });
      setShowRemoveModal(false);
      setConfirmationInput('');
    } else {
      toast.error(`Please type "${projectName}" to confirm removal`);
    }
  };

  const handleCancelRemoval = () => {
    setShowRemoveModal(false);
    setConfirmationInput('');
  };

  const getProjectName = () => {
    return launch?.name || project?.name || 'project-name';
  };

  const isOwner = session?.user?.id === launch.owner?.id;

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
                <span className="text-neutral-400">
                  {launch.status === 'scheduled' ? 'Scheduled For' : 'Launch Date'}
                </span>
                <span className="text-neutral-300">
                  {launch.status === 'scheduled'
                    ? formatDistanceToNow(new Date(launch.launchDate), { addSuffix: true })
                    : `${formatDistanceToNow(new Date(launch.launchDate))} ago`}
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

        <div className="space-y-3">
          <Button variant="outline" className="w-full gap-2 rounded-none" asChild>
            <Link href={`/projects/${projectId}`}>
              <ExternalLink className="h-4 w-4" />
              View Project
            </Link>
          </Button>
          {isOwner && (
            <Button
              variant="destructive"
              className="w-full gap-2 rounded-none"
              onClick={handleRemoveLaunch}
              disabled={removeLaunchMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
              {removeLaunchMutation.isPending ? 'Removing...' : 'Remove Launch'}
            </Button>
          )}
        </div>
      </div>
      <Dialog open={showRemoveModal} onOpenChange={setShowRemoveModal}>
        <DialogContent className="rounded-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <Trash2 className="h-5 w-5" />
              Remove Launch
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              This will permanently remove the launch and this action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm text-neutral-300">
                Type{' '}
                <span className="font-mono font-semibold text-red-400">{getProjectName()}</span> to
                confirm removal:
              </p>
              <Input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && confirmationInput === getProjectName()) {
                    handleConfirmRemoval();
                  } else if (e.key === 'Escape') {
                    handleCancelRemoval();
                  }
                }}
                placeholder={getProjectName()}
                className="rounded-none bg-red-500/10 text-white placeholder:text-red-400/60 focus:ring-offset-0 focus-visible:ring-0"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="destructive"
                className="rounded-none"
                onClick={handleConfirmRemoval}
                disabled={confirmationInput !== getProjectName() || removeLaunchMutation.isPending}
              >
                {removeLaunchMutation.isPending ? 'Removing...' : 'Remove Launch'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
