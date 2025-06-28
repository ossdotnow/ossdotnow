import { project as projectSchema, projectProviderEnum } from '@workspace/db/schema';
import ProjectTicks from '@/components/project/project-ticks';
import { Star, GitFork, Clock } from 'lucide-react';
import Link from '@workspace/ui/components/link';
import { useQuery } from '@tanstack/react-query';
import NumberFlow from '@number-flow/react';
import { useTRPC } from '@/hooks/use-trpc';
import { formatDate } from '@/lib/utils';
import Image from 'next/image';

type Project = typeof projectSchema.$inferSelect;

const isValidProvider = (
  provider: string | null,
): provider is (typeof projectProviderEnum.enumValues)[number] => {
  return provider === 'github' || provider === 'gitlab';
};

export default function ProjectCard({ project }: { project: Project }) {
  const trpc = useTRPC();
  const { data: repo, isError } = useQuery({
    ...trpc.repository.getRepo.queryOptions({
      url: project.gitRepoUrl,
      provider: project.gitHost as (typeof projectProviderEnum.enumValues)[number],
    }),
    enabled: !!project.gitRepoUrl && isValidProvider(project.gitHost),
    staleTime: 1000 * 60 * 60 * 24,
  });

  if (isError) return <div>Error</div>;

  return (
    <div className="group/project relative border border-neutral-800 bg-neutral-900/50 p-6 transition-all hover:border-neutral-700">
      <Link
        href={`/projects/${project.id}`}
        event="project_card_link_clicked"
        eventObject={{ projectId: project.id }}
      >
        <span className="sr-only">View {project.name}</span>
        <div className="mb-4 flex items-start gap-3">
          {(repo && repo?.owner && repo?.owner?.avatar_url) ||
          (repo?.namespace && repo?.namespace?.avatar_url) ? (
            <Image
              src={repo?.owner?.avatar_url || `https://gitlab.com${repo?.namespace?.avatar_url}`}
              alt={project.name ?? 'Project Logo'}
              width={48}
              height={48}
              className="h-20 w-20 rounded-full"
            />
          ) : (
            <div className="h-20 w-20 animate-pulse rounded-md bg-neutral-800" />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white">{project.name}</h3>
              <ProjectTicks project={project} />
            </div>
            {(project.isLookingForContributors || project.hasBeenAcquired) && (
              <div className="mt-2 flex flex-wrap gap-2">
                {project.isLookingForContributors && (
                  <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400">
                    Open to contributors
                  </span>
                )}
                {project.hasBeenAcquired && (
                  <span className="rounded-md bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-400">
                    Acquired
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-neutral-400">{project.description}</p>

        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 text-neutral-500" />
            <span className="text-neutral-300">
              <NumberFlow value={repo?.stargazers_count || repo?.star_count || 0} />
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <GitFork className="h-4 w-4 text-neutral-500" />
            <span className="text-neutral-300">
              <NumberFlow value={repo?.forks_count || 0} />
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-neutral-500" />
            <span className="text-neutral-300">
              <NumberFlow value={new Date(repo?.created_at).getDate() || 0} />
              /
              <NumberFlow value={new Date(repo?.created_at).getMonth() + 1 || 0} />
              /
              <NumberFlow value={new Date(repo?.created_at).getFullYear() || 0} />
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
