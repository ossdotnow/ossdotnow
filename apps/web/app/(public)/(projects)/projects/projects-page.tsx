'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import LoadingSpinner from '@/components/loading-spinner';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/hooks/use-trpc';
import ProjectCard from './project-card';
import { useQueryState } from 'nuqs';

export default function ProjectsPage() {
  const trpc = useTRPC();
  const [page, setPage] = useQueryState('page', {
    defaultValue: '1',
    parse: (value) => value || '1',
  });

  const pageNumber = parseInt(page, 10);
  const pageSize = 20;

  const { data, isLoading, isError } = useQuery(
    trpc.projects.getProjects.queryOptions({
      approvalStatus: 'approved',
      page: pageNumber,
      pageSize,
    }),
  );

  return (
    <div className="container mx-auto">
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

        {isLoading ? (
          <LoadingSpinner />
        ) : isError ? (
          <div className="text-center text-sm text-red-700">Error loading projects</div>
        ) : data && data.data.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {data.data.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center text-sm">No projects found</div>
        )}

        {data && data.pagination && data.pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(String(pageNumber - 1))}
              disabled={!data.pagination.hasPreviousPage}
              className="rounded-none border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-300 hover:border-neutral-700 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {pageNumber > 3 && (
                <>
                  <Button
                    variant={pageNumber === 1 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage('1')}
                    className="rounded-none border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-300 hover:border-neutral-700"
                  >
                    1
                  </Button>
                  {pageNumber > 4 && <span className="px-2 text-neutral-500">...</span>}
                </>
              )}

              {Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
                const p = pageNumber - 2 + i;
                if (p < 1 || p > data.pagination.totalPages) return null;
                if (pageNumber <= 3 && p > 5) return null;
                if (
                  pageNumber > data.pagination.totalPages - 3 &&
                  p < data.pagination.totalPages - 4
                )
                  return null;

                return (
                  <Button
                    key={p}
                    variant={p === pageNumber ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(String(p))}
                    className={`rounded-none border border-neutral-800 px-3 py-2 text-sm hover:border-neutral-700 ${
                      p === pageNumber ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-300'
                    }`}
                  >
                    {p}
                  </Button>
                );
              }).filter(Boolean)}

              {pageNumber < data.pagination.totalPages - 2 && (
                <>
                  {pageNumber < data.pagination.totalPages - 3 && (
                    <span className="px-2 text-neutral-500">...</span>
                  )}
                  <Button
                    variant={pageNumber === data.pagination.totalPages ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(String(data.pagination.totalPages))}
                    className="rounded-none border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-300 hover:border-neutral-700"
                  >
                    {data.pagination.totalPages}
                  </Button>
                </>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(String(pageNumber + 1))}
              disabled={!data.pagination.hasNextPage}
              className="rounded-none border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-300 hover:border-neutral-700 disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {data && data.pagination && (
          <div className="mt-4 text-center text-sm text-neutral-500">
            Showing {(pageNumber - 1) * pageSize + 1} -{' '}
            {Math.min(pageNumber * pageSize, data.pagination.totalCount)} of{' '}
            {data.pagination.totalCount} projects
          </div>
        )}
      </div>
    </div>
  );
}
