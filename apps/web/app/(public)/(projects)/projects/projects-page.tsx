'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { useQuery } from '@tanstack/react-query';
import { Filter, Search } from 'lucide-react';
import { useTRPC } from '@/hooks/use-trpc';
import ProjectCard from './project-card';

export default function ProjectsPage() {
  const trpc = useTRPC();
  const {
    data: projects,
    isLoading,
    isError,
  } = useQuery(trpc.projects.getProjects.queryOptions({ approvalStatus: 'approved' }));

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error</div>;
  if (!projects) return <div>No projects found</div>;

  return (
    <div className="">
      <div className="py-8">
        <div className="mb-8 flex items-center justify-between gap-2">
          <div className="relative max-w-xl flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <Input
              type="text"
              placeholder="Search tools..."
              className="w-full rounded-none border border-neutral-800 bg-neutral-900 py-2.5 pr-4 pl-10 text-sm text-white placeholder-neutral-500 focus:border-neutral-700 focus:outline-none"
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
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </div>
  );
}
