'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import { Button } from '@workspace/ui/components/button';
import { Flag, Share2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/hooks/use-trpc';
import { formatDistanceToNow } from 'date-fns';
import { projectProviderEnum } from '@workspace/db/schema';
import { toast } from 'sonner';

const isValidProvider = (
  provider: string | null | undefined,
): provider is (typeof projectProviderEnum.enumValues)[number] => {
  return provider === 'github' || provider === 'gitlab';
};

interface LaunchHeaderProps {
  launch: any;
  project: any;
  projectId: string;
}

export default function LaunchHeader({ launch, project, projectId }: LaunchHeaderProps) {
  const trpc = useTRPC();

  // Fetch repository data
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

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: launch?.name,
          text: launch?.tagline,
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

  const handleReport = async () => {
    toast.error('Please login to report');
  };

  return (
    <div className="border border-neutral-800 bg-neutral-900/50 p-6">
      <div className="flex flex-row gap-4 sm:gap-6">
        {/* Column 1: Repo Logo */}
        <div className="flex-shrink-0 self-stretch order-2 sm:order-1 sm:self-stretch">
          <div className="h-20 mx-auto max-w-32 sm:h-full">
            {(repoQuery.data && repoQuery.data?.owner && repoQuery.data?.owner?.avatar_url) ||
            (repoQuery.data?.namespace && repoQuery.data?.namespace?.avatar_url) ? (
              <img
                src={repoQuery.data?.owner?.avatar_url || `https://gitlab.com${repoQuery.data?.namespace?.avatar_url}`}
                alt={`${launch.name} logo`}
                className="h-full w-full rounded-none object-cover"
                loading="lazy"
              />
            ) : (
              <div className="h-full w-full animate-pulse bg-neutral-900" />
            )}
          </div>
        </div>

        {/* Column 2: Repo Name, Description, User Info */}
        <div className="flex-1 min-w-0 order-1 sm:order-2">
          <h1 className="mb-2 text-3xl font-bold">{launch.name}</h1>
          <p className="text-lg text-neutral-400 mb-2">{launch.tagline}</p>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={launch.owner?.image} />
                <AvatarFallback>{launch.owner?.name?.[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-neutral-400">
                {launch.owner?.name || 'Unknown'} launched{' '}
                {launch.launchDate
                  ? formatDistanceToNow(new Date(launch.launchDate))
                  : 'recently'}{' '}
                ago
              </span>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleShare} className="gap-2 rounded-none">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button
                variant="outline"
                onClick={handleReport}
                className="gap-2 rounded-none"
                disabled={false}
              >
                <Flag className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
