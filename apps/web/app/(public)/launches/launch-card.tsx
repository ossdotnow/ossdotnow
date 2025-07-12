import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectProviderEnum } from '@workspace/db/schema';
import { Button } from '@workspace/ui/components/button';
import { ArrowUp, MessageCircle } from 'lucide-react';
import { authClient } from '@workspace/auth/client';
import Icons from '@workspace/ui/components/icons';
import Link from '@workspace/ui/components/link';
import NumberFlow from '@number-flow/react';
import { useTRPC } from '@/hooks/use-trpc';
import { formatDate } from '@/lib/utils';
import Image from 'next/image';
import { toast } from 'sonner';

const isValidProvider = (
  provider: string | null,
): provider is (typeof projectProviderEnum.enumValues)[number] => {
  return provider === 'github' || provider === 'gitlab';
};

const getRankBadge = (index: number) => {
  if (index === 0)
    return { text: '1st Place', color: 'from-0% from-yellow-600/30 via-10%  to-transparent' };
  if (index === 1)
    return { text: '2nd Place', color: 'from-0% from-gray-600/30 via-10%  to-transparent' };
  if (index === 2)
    return { text: '3rd Place', color: 'from-0% from-orange-600/30 via-10%  to-transparent' };
  return null;
};

export default function LaunchCard({ project, index }: { project: any; index?: number }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const { data: repo, isError } = useQuery({
    ...trpc.repository.getRepo.queryOptions({
      url: project.gitRepoUrl,
      provider: project.gitHost as (typeof projectProviderEnum.enumValues)[number],
    }),
    enabled: !!project.gitRepoUrl && isValidProvider(project.gitHost),
    staleTime: 1000 * 60 * 60 * 24,
  });

  const rankBadge = getRankBadge(index ?? 0);

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

  if (isError) return <div>Error</div>;

  return (
    <Link
      href={`/launches/${project.id}`}
      event="project_card_link_clicked"
      eventObject={{ projectId: project.id }}
      className="group/project relative flex h-full flex-col bg-[#171717] p-1"
    >
      <span className="sr-only">View {project.name}</span>
      {rankBadge && (
        <div
          className={`bg-linear-to-r ${rankBadge.color} mb-1 flex h-8 items-center px-2 py-1 text-xs font-semibold`}
        >
          <span className={`text-xs font-semibold text-white`}>{rankBadge.text}</span>
        </div>
      )}
      <div className="flex flex-1 grow flex-col gap-2 border border-[#404040] bg-[#262626] p-4">
        <div className="flex items-center gap-3">
          {(repo && repo?.owner && repo?.owner?.avatar_url) ||
          (repo?.namespace && repo?.namespace?.avatar_url) ? (
            <Image
              src={repo?.owner?.avatar_url || `https://gitlab.com${repo?.namespace?.avatar_url}`}
              alt={project.name ?? 'Project Logo'}
              width={256}
              height={256}
              className="h-[78px] w-[78px] rounded-none"
            />
          ) : (
            <div className="h-[78px] w-[78px] animate-pulse bg-neutral-900" />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-white md:text-base">
              {project.name} -{' '}
              <span className="font-light text-neutral-300">{project.gitRepoUrl}</span>
            </h3>
            <p className="line-clamp-2 text-xs leading-relaxed text-neutral-400 md:text-sm">
              {project.description}
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between pt-1">
          <div className="flex h-full items-center gap-2 pl-2">
            {project.owner?.image ? (
              <Image
                src={project.owner?.image}
                alt={project.owner?.name ?? 'Project Owner'}
                width={256}
                height={256}
                className="size-6 rounded-full"
              />
            ) : (
              <div className="size-8 animate-pulse bg-neutral-700" />
            )}
            <div className="flex flex-col">
              <p className="text-sm font-medium text-white">{project.owner?.name}</p>
              <p className="text-xs text-neutral-400">/{project.owner?.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs md:text-sm">
            <div className="flex flex-row items-center gap-4">
              <div className="flex items-center gap-1">
                <Icons.star className="h-3 w-3 text-yellow-600 md:h-3.5 md:w-3.5" />
                <span className="text-neutral-300">
                  <NumberFlow value={repo?.stargazers_count || repo?.star_count || 0} />
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Icons.fork className="h-3 w-3 text-purple-600 md:h-3.5 md:w-3.5" />
                <span className="text-neutral-300">
                  <NumberFlow value={repo?.forks_count || 0} />
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Icons.clock className="h-3 w-3 text-neutral-500 md:h-3.5 md:w-3.5" />
                <span className="text-neutral-300">
                  {project?.launchDate ? formatDate(new Date(project.launchDate)) : 'N/A'}
                </span>
              </div>
            </div>
            <div className="flex flex-row items-center gap-1">
              <div className="flex items-center gap-1">
                <div className="flex h-8 flex-row items-center gap-1 border border-[#404040] p-2 text-xs text-neutral-400">
                  <MessageCircle className="h-4 w-4" />
                  <span className="tabular-nums">{project.commentCount}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant={project.hasVoted ? 'default' : 'outline'}
                  size="sm"
                  className={`flex h-8 flex-row items-center gap-1 rounded-none border p-2 ${
                    project.hasVoted
                      ? 'border-[#404040] bg-[#262626] text-white hover:border-[#343434] hover:bg-[#343434] hover:text-white'
                      : 'border-neutral-300 bg-neutral-300 text-black hover:border-neutral-400 hover:bg-neutral-400 hover:text-black'
                  }`}
                  onClick={() => handleVote(project.id)}
                  disabled={voteMutation.isPending}
                >
                  <ArrowUp className="h-4 w-4" />
                  <span className="text-xs font-semibold tabular-nums">{project.voteCount}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
