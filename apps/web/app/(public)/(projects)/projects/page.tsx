import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Clock, Filter, GitFork, Search, Star } from 'lucide-react';
import ProjectTicks from '@/components/project/project-ticks';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { projects } from './data';
import Image from 'next/image';
import Link from 'next/link';

export default async function ProjectsPage() {
  return (
    <div className="min-h-screen">
      <div className="py-8">
        <div className="mb-8 flex items-center justify-between gap-2">
          <div className="relative max-w-xl flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <Input
              type="text"
              placeholder="Search tools..."
              className="w-full rounded-none border border-neutral-800 bg-neutral-900 py-2.5 pl-10 pr-4 text-sm text-white placeholder-neutral-500 focus:border-neutral-700 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="outline"
              className="flex items-center gap-2 rounded-none border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-neutral-300 hover:border-neutral-700"
            >
              <Filter size={16} />
              Filters
            </Button>
            <Select>
              <SelectTrigger className="w-30 rounded-none border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-neutral-300 focus:border-neutral-700 focus:outline-none">
                <SelectValue placeholder="Order by" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem className="rounded-none" value="stars">
                  Stars
                </SelectItem>
                <SelectItem className="rounded-none" value="recent">
                  Recent
                </SelectItem>
                <SelectItem className="rounded-none" value="forks">
                  Forks
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group/project relative border border-neutral-800 bg-neutral-900/50 p-6 transition-all hover:border-neutral-700"
            >
              <Link href={`/p/${project.id}`}>
                <span className="sr-only">View {project.name}</span>
                <div className="mb-4 flex items-start gap-3">
                  <Image
                    src={project.logoUrl ?? 'https://placehold.co/48x48'}
                    alt={project.name ?? 'Project Logo'}
                    width={48}
                    height={48}
                    className="h-20 w-20 rounded-full"
                  />
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

                <p className="mb-4 text-sm leading-relaxed text-neutral-400">
                  {project.description}
                </p>

                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-neutral-500" />
                    <span className="text-neutral-300">
                      {Math.floor(Math.random() * 100000).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <GitFork className="h-4 w-4 text-neutral-500" />
                    <span className="text-neutral-300">
                      {Math.floor(Math.random() * 10000).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-neutral-500" />
                    <span className="text-neutral-300">
                      {Math.floor(Math.random() * 24)} hours ago
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
