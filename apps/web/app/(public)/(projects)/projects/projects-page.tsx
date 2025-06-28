'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Filter, Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import LoadingSpinner from '@/components/loading-spinner';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/hooks/use-trpc';
import { useState, useMemo } from 'react';
import ProjectCard from './project-card';
import { useQueryState } from 'nuqs';

export default function ProjectsPage() {
  const trpc = useTRPC();
  const [page, setPage] = useQueryState('page', {
    defaultValue: '1',
    parse: (value) => value || '1',
  });
  const [searchQuery, setSearchQuery] = useState('');

  const pageNumber = parseInt(page, 10);
  const pageSize = 20;

  const { data, isLoading, isError } = useQuery(
    trpc.projects.getProjects.queryOptions({
      approvalStatus: 'approved',
      page: pageNumber,
      pageSize,
    }),
  );

  const { data: featuredProjects } = useQuery(
    trpc.projects.getProjects.queryOptions({
      approvalStatus: 'approved',
      page: 1,
      pageSize: 4,
    }),
  );

  const filteredProjects = useMemo(() => {
    if (!data?.data) return [];
    if (!searchQuery.trim()) return data.data;

    const query = searchQuery.toLowerCase().trim();
    return data.data.filter((project) => project.name.toLowerCase().includes(query));
  }, [data?.data, searchQuery]);

  const filteredFeaturedProjects = useMemo(() => {
    if (!featuredProjects?.data) return [];
    if (!searchQuery.trim()) return featuredProjects.data.filter((p) => p.isPinned);

    const query = searchQuery.toLowerCase().trim();
    return featuredProjects.data
      .filter((p) => p.isPinned)
      .filter((project) => project.name.toLowerCase().includes(query));
  }, [featuredProjects?.data, searchQuery]);

  return (
    <div className="container mx-auto">
      <div className="py-8">
        <div className="mb-8 flex items-center justify-between gap-2">
          <div className="relative max-w-xl flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <Input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-none border border-neutral-800 bg-neutral-900 py-2.5 pr-10 pl-10 text-sm text-white placeholder-neutral-500 focus:border-neutral-700 focus:outline-none"
            />
            {searchQuery.trim() && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-neutral-500 transition-colors hover:text-neutral-300"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
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

        {!searchQuery.trim() && filteredFeaturedProjects.length > 0 && (
          <div className="mb-12">
            <div className="mb-6">
              <h2 className="mb-2 text-2xl font-bold text-white">Featured Projects</h2>
              <p className="text-neutral-400">Your favorite projects, curated by the community</p>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              {filteredFeaturedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="mb-2 text-2xl font-bold text-white">
            {!searchQuery.trim() && filteredFeaturedProjects.length > 0
              ? 'All Projects'
              : 'Projects'}
          </h2>
          <p className="text-neutral-400">
            {searchQuery.trim()
              ? `Found ${filteredProjects.length} project${filteredProjects.length === 1 ? '' : 's'} matching "${searchQuery}"`
              : 'Discover amazing open source projects'}
          </p>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : isError ? (
          <div className="text-center text-sm text-red-700">Error loading projects</div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : searchQuery.trim() ? (
          <div className="text-center text-sm text-neutral-400">
            No projects found matching "{searchQuery}".
          </div>
        ) : (
          <div className="text-center text-sm">No projects found</div>
        )}

        {!searchQuery.trim() && data && data.pagination && data.pagination.totalPages > 1 && (
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

        {!searchQuery.trim() && data && data.pagination && (
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
