import {
  Briefcase,
  Building,
  Code,
  DollarSign,
  ExternalLink,
  GitFork,
  Github,
  Globe,
  Linkedin,
  Star,
  Tag,
  Twitter,
  Users,
} from 'lucide-react';
import { Separator } from '@workspace/ui/components/separator';
import ProjectTicks from '@/components/project/project-ticks';
import { Button } from '@workspace/ui/components/button';
import { project } from '../../projects/data';
import Image from 'next/image';
import Link from 'next/link';

const getProject = async (id: string) => {
  console.log(id);
  return project;
};

export default async function Page({ params }: { params: { id: string } }) {
  const { id } = params;

  const project = await getProject(id);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  const stats = {
    stars: Math.floor(Math.random() * 100000),
    forks: Math.floor(Math.random() * 10000),
    contributors: Math.floor(Math.random() * 1000),
    commits: Math.floor(Math.random() * 50000),
  };

  return (
    <div className="mt-8">
      <div className="mx-auto max-w-6xl border border-neutral-800 bg-neutral-900/50 py-8">
        <div className="px-4">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <Image
                src={project?.logoUrl ?? 'https://placehold.co/100x100'}
                alt={project?.name ?? 'Project Logo'}
                width={100}
                height={100}
                className="h-24 w-24 rounded-full border border-neutral-800"
              />
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-white">{project?.name}</h1>
                  <ProjectTicks project={project} />
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <span className="rounded-md bg-neutral-800 px-3 py-1 text-sm font-medium text-neutral-300">
                    {project?.status?.replace('-', ' ')}
                  </span>
                  <span className="rounded-md bg-neutral-800 px-3 py-1 text-sm font-medium text-neutral-300">
                    {project?.type?.replace('-', ' ')}
                  </span>
                  {project?.hasBeenAcquired && (
                    <span className="rounded-md bg-yellow-500/10 px-3 py-1 text-sm font-medium text-yellow-400">
                      Acquired
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={project?.gitRepoUrl ?? '#'} target="_blank">
                <Button
                  variant="outline"
                  className="rounded-none border-neutral-800 bg-neutral-900 hover:border-neutral-700"
                >
                  <Github className="h-4 w-4" />
                  View on GitHub
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="flex flex-col gap-8 lg:col-span-2">
            <div className="border border-neutral-800 bg-neutral-900/50 p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Repository Stats</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-neutral-400">
                    <Star className="h-4 w-4" />
                    <span className="text-sm">Stars</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {stats.stars.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-neutral-400">
                    <GitFork className="h-4 w-4" />
                    <span className="text-sm">Forks</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {stats.forks.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-neutral-400">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Contributors</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {stats.contributors.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-neutral-400">
                    <Code className="h-4 w-4" />
                    <span className="text-sm">Commits</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {stats.commits.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-neutral-800 bg-neutral-900/50 p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Description</h2>
              <p className="mt-2 text-base text-neutral-400">{project?.description}</p>
            </div>

            {(project?.isLookingForContributors ||
              project?.isLookingForInvestors ||
              project?.isHiring) && (
              <div className="border border-neutral-800 bg-neutral-900/50 p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">Opportunities</h2>
                <div className="space-y-3">
                  {project?.isLookingForContributors && (
                    <div className="flex items-center gap-3 rounded-md bg-emerald-500/10 p-3">
                      <Users className="h-5 w-5 text-emerald-400" />
                      <div>
                        <p className="font-medium text-emerald-400">Open to Contributors</p>
                        <p className="text-sm text-neutral-400">
                          This project is actively seeking contributors
                        </p>
                      </div>
                    </div>
                  )}
                  {project?.isLookingForInvestors && (
                    <div className="flex items-center gap-3 rounded-md bg-blue-500/10 p-3">
                      <DollarSign className="h-5 w-5 text-blue-400" />
                      <div>
                        <p className="font-medium text-blue-400">Seeking Investment</p>
                        <p className="text-sm text-neutral-400">
                          Open to investor discussions and funding
                        </p>
                      </div>
                    </div>
                  )}
                  {project?.isHiring && (
                    <div className="flex items-center gap-3 rounded-md bg-purple-500/10 p-3">
                      <Briefcase className="h-5 w-5 text-purple-400" />
                      <div>
                        <p className="font-medium text-purple-400">We're Hiring!</p>
                        <p className="text-sm text-neutral-400">Check out available positions</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="border border-neutral-800 bg-neutral-900/50 p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <Tag className="h-5 w-5" />
                Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {project?.tags?.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="rounded-full bg-neutral-800 px-3 py-1 text-sm text-neutral-300 transition-colors hover:bg-neutral-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <div className="border border-neutral-800 bg-neutral-900/50 p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">About</h2>
              <div className="space-y-3 text-sm">
                {project?.createdAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Created</span>
                    <span className="text-neutral-300">{formatDate(project?.createdAt)}</span>
                  </div>
                )}
                {project?.updatedAt && (
                  <>
                    <Separator className="bg-neutral-800" />
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Last Updated</span>
                      <span className="text-neutral-300">{formatDate(project?.updatedAt)}</span>
                    </div>
                  </>
                )}
                {project?.gitHost && (
                  <>
                    <Separator className="bg-neutral-800" />
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Host</span>
                      <span className="capitalize text-neutral-300">{project?.gitHost}</span>
                    </div>
                  </>
                )}
                <Separator className="bg-neutral-800" />
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Visibility</span>
                  <span className="text-neutral-300">
                    {project?.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>
            </div>

            {project?.socialLinks && (
              <div className="border border-neutral-800 bg-neutral-900/50 p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">Links</h2>
                <div className="space-y-3">
                  {project.socialLinks.website && (
                    <Link
                      href={project.socialLinks.website}
                      target="_blank"
                      className="flex items-center gap-3 text-neutral-300 transition-colors hover:text-white"
                    >
                      <Globe className="h-4 w-4" />
                      <span className="text-sm">Website</span>
                      <ExternalLink className="ml-auto h-3 w-3" />
                    </Link>
                  )}
                  {project.socialLinks.github && (
                    <Link
                      href={project.socialLinks.github}
                      target="_blank"
                      className="flex items-center gap-3 text-neutral-300 transition-colors hover:text-white"
                    >
                      <Github className="h-4 w-4" />
                      <span className="text-sm">GitHub</span>
                      <ExternalLink className="ml-auto h-3 w-3" />
                    </Link>
                  )}
                  {project.socialLinks.twitter && (
                    <Link
                      href={project.socialLinks.twitter}
                      target="_blank"
                      className="flex items-center gap-3 text-neutral-300 transition-colors hover:text-white"
                    >
                      <Twitter className="h-4 w-4" />
                      <span className="text-sm">Twitter</span>
                      <ExternalLink className="ml-auto h-3 w-3" />
                    </Link>
                  )}
                  {project.socialLinks.linkedin && (
                    <Link
                      href={project.socialLinks.linkedin}
                      target="_blank"
                      className="flex items-center gap-3 text-neutral-300 transition-colors hover:text-white"
                    >
                      <Linkedin className="h-4 w-4" />
                      <span className="text-sm">LinkedIn</span>
                      <ExternalLink className="ml-auto h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            )}

            {project?.hasBeenAcquired && project?.acquiredBy && (
              <div className="border border-yellow-500/20 bg-yellow-500/5 p-6">
                <div className="flex items-center gap-2 text-yellow-400">
                  <Building className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">Acquisition</h2>
                </div>
                <p className="mt-2 text-sm text-neutral-300">This project has been acquired</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
