import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectProviderEnum } from '@workspace/db/schema';
import { Button } from '@workspace/ui/components/button';
import { ArrowUp, MessageCircle } from 'lucide-react';
import { authClient } from '@workspace/auth/client';
import Icons from '@workspace/ui/components/icons';
import Link from '@workspace/ui/components/link';
import { useTRPC } from '@/hooks/use-trpc';
import { formatDate } from '@/lib/utils';
import Image from 'next/image';
import { toast } from 'sonner';
import { useRouter, usePathname } from 'next/navigation';

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

  const router = useRouter();
  const currentPath = usePathname();

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
      await router.push(`/login?redirect=${currentPath}`);
      toast.error('Please login to vote');
      return;
    }
    voteMutation.mutate({ projectId });
  };

  if (isError) return <div>Error</div>;

  return (
    <div className="group/project relative flex h-full flex-col bg-[#171717] p-1">
      <span className="sr-only">View {project.name}</span>
      {rankBadge && (
        <div
          className={`bg-gradient-to-r ${rankBadge.color} mb-1 flex h-8 items-center px-2 py-1 text-xs font-semibold`}
        >
          <span className={`text-xs font-semibold text-white`}>{rankBadge.text}</span>
        </div>
      )}
      <Link
        href={`/launches/${project.id}`}
        event="project_card_link_clicked"
        eventObject={{ projectId: project.id }}
        className="flex flex-1 grow flex-col gap-2 border border-[#404040] bg-[#262626] p-4"
      >
        <div className="flex items-center gap-3">
          {(repo && repo?.owner && repo?.owner?.avatar_url) ||
          (repo?.namespace && repo?.namespace?.avatar_url) ? (
            <Image
              src={repo?.owner?.avatar_url || `https://gitlab.com${repo?.namespace?.avatar_url}`}
              alt={project.name ?? 'Project Logo'}
              width={256}
              height={256}
              className="h-12 w-12 rounded-none sm:h-[78px] sm:w-[78px]"
            />
          ) : (
            <div className="h-12 w-12 animate-pulse bg-neutral-900 sm:h-[78px] sm:w-[78px]" />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-white md:text-base">
              <span className="block truncate sm:inline">{project.name}</span>
              <span className="hidden sm:inline"> - </span>
              <span className="block truncate font-light text-neutral-300 sm:inline">
                {project.gitRepoUrl}
              </span>
            </h3>
            <p className="line-clamp-2 text-xs leading-relaxed text-neutral-400 sm:line-clamp-1 md:text-sm">
              {project.description}
            </p>
            <span className="mt-2 flex w-full flex-row gap-1 overflow-x-auto sm:gap-2">
              <span className="rounded-none bg-[#171717] px-1.5 py-1 text-xs font-medium text-nowrap text-neutral-300 sm:px-2">
                {project?.status || 'Unknown Status'}
              </span>
              <span className="rounded-none bg-[#171717] px-1.5 py-1 text-xs font-medium text-nowrap text-neutral-300 sm:px-2">
                {project?.type || 'Unknown Type'}
              </span>
              {project.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-none bg-[#171717] px-1.5 py-1 text-xs font-medium text-nowrap text-neutral-300 sm:px-2"
                >
                  {tag}
                </span>
              ))}
            </span>
          </div>
        </div>
      </Link>

      <div>
        <div className="flex items-center justify-between pt-1">
          <div className="hidden h-full items-center gap-2 pl-2 sm:flex">
            {project.owner?.image ? (
              <Image
                src={project.owner?.image}
                alt={project.owner?.name ?? 'Project Owner'}
                width={256}
                height={256}
                className="size-6 rounded-full"
              />
            ) : (
              <div className="size-6 animate-pulse bg-neutral-700" />
            )}
            <div className="flex">
              <p className="text-xs font-medium text-white">{project.owner?.name}</p>
              <p className="text-xs text-neutral-400">/{project.owner?.username}</p>
            </div>
          </div>
          <div className="flex w-full items-center justify-between gap-2 text-xs sm:w-auto sm:justify-end sm:gap-4 md:text-sm">
            <div className="flex flex-row items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1">
                <Icons.star className="h-3 w-3 text-yellow-600 md:h-3.5 md:w-3.5" />
                <span className="text-neutral-300">
                  {repo?.stargazers_count || repo?.star_count || 0}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Icons.fork className="h-3 w-3 text-purple-600 md:h-3.5 md:w-3.5" />
                <span className="text-neutral-300">{repo?.forks_count || 0}</span>
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
                <div className="flex h-7 flex-row items-center gap-1 border border-[#404040] p-1.5 text-xs text-neutral-400 sm:h-8 sm:p-2">
                  <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="tabular-nums">{project.commentCount}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant={project.hasVoted ? 'default' : 'outline'}
                  size="sm"
                  className={`flex h-7 cursor-pointer flex-row items-center gap-1 rounded-none border p-1.5 sm:h-8 sm:p-2 ${
                    project.hasVoted
                      ? 'border-[#404040] bg-[#262626] text-white hover:border-[#343434] hover:bg-[#343434] hover:text-white'
                      : 'border-neutral-300 bg-neutral-300 text-black hover:border-neutral-400 hover:bg-neutral-400 hover:text-black'
                  }`}
                  onClick={() => handleVote(project.id)}
                  disabled={voteMutation.isPending}
                >
                  <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs font-semibold tabular-nums">{project.voteCount}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
