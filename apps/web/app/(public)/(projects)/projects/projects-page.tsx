'use client';

import ProjectFilters from '@/components/projects/project-filters';
import LoadingSpinner from '@/components/loading-spinner';
import { Button } from '@workspace/ui/components/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { parseAsString, useQueryState } from 'nuqs';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useTRPC } from '@/hooks/use-trpc';
import ProjectCard from './project-card';
import { useInView } from 'react-intersection-observer';

function VirtualizedProjectCard({ project }: { project: any }) {
  const { ref, inView } = useInView({
    rootMargin: '400px 0px',
    triggerOnce: false,
  });
  const CARD_HEIGHT = 160;
  return (
    <div ref={ref} style={{ minHeight: CARD_HEIGHT }}>
      {inView ? <ProjectCard project={project} /> : <div style={{ height: CARD_HEIGHT }} />}
    </div>
  );
}

export default function ProjectsPage() {
  const trpc = useTRPC();
  const [page, setPage] = useQueryState('page', {
    defaultValue: '1',
    parse: (value) => value || '1',
  });
  const [searchQuery] = useQueryState('search', parseAsString.withDefault(''));
  const [statusFilter] = useQueryState('status', parseAsString.withDefault('all'));
  const [typeFilter] = useQueryState('type', parseAsString.withDefault('all'));
  const [tagFilter] = useQueryState('tag', parseAsString.withDefault('all'));
  const [sortBy] = useQueryState('sort', parseAsString.withDefault('name'));
  const [showShadow, setShowShadow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowShadow(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setPage('1');
  }, [searchQuery, statusFilter, typeFilter, tagFilter, sortBy, setPage]);

  const pageNumber = parseInt(page, 10);
  const pageSize = 50;

  const { data, isLoading, isError } = useQuery(
    trpc.projects.getProjects.queryOptions({
      approvalStatus: 'approved',
      page: pageNumber,
      pageSize,
      searchQuery: searchQuery || undefined,
      statusFilter: statusFilter === 'all' ? undefined : statusFilter,
      typeFilter: typeFilter === 'all' ? undefined : typeFilter,
      tagFilter: tagFilter === 'all' ? undefined : tagFilter,
      sortBy: sortBy as 'recent' | 'name' | 'stars' | 'forks' | undefined,
    }),
  );

  const { data: featuredProjects } = useQuery(
    trpc.projects.getProjects.queryOptions({
      approvalStatus: 'approved',
      page: 1,
      pageSize: 4,
      searchQuery: searchQuery || undefined,
      statusFilter: statusFilter === 'all' ? undefined : statusFilter,
      typeFilter: typeFilter === 'all' ? undefined : typeFilter,
      tagFilter: tagFilter === 'all' ? undefined : tagFilter,
      sortBy: sortBy as 'recent' | 'name' | 'stars' | 'forks' | undefined,
    }),
  );

  const projects = data?.data || [];
  const pinnedProjects = featuredProjects?.data?.filter((p) => p.isPinned) || [];

  const hasActiveFilters =
    searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || tagFilter !== 'all';

  return (
    <div className="relative mx-auto min-h-screen max-w-[1080px]">
      <div
        className={`pointer-events-none fixed top-[calc(32px+65px+36px)] z-10 h-10 w-full bg-gradient-to-b from-[#101010] to-transparent transition-all duration-300 ${
          showShadow ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div className="fixed top-0 right-0 left-0 z-10 h-[32px] bg-[#101010]" />
      <div className="py-6">
        <ProjectFilters />

        {!hasActiveFilters && pinnedProjects.length > 0 && (
          <div className="mb-12">
            <div className="mb-6">
              <h2 className="mb-2 text-2xl font-bold text-white">Featured Projects</h2>
              <p className="text-neutral-400">Your favorite projects, curated by the community</p>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              {pinnedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="mb-2 text-2xl font-bold text-white">
            {!hasActiveFilters && pinnedProjects.length > 0 ? 'All Projects' : 'Projects'}
          </h2>
          <p className="text-neutral-400">
            {hasActiveFilters && data
              ? `Found ${data.pagination.totalCount} project${data.pagination.totalCount === 1 ? '' : 's'}`
              : 'Discover amazing open source projects'}
          </p>
        </div>

        {isLoading ? (
          <LoadingSpinner className="mt-10" />
        ) : isError ? (
          <div className="text-center text-sm text-red-700">Error loading projects</div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {projects.map((project) => (
              <VirtualizedProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : hasActiveFilters ? (
          <div className="text-center text-sm text-neutral-400">
            No projects found with the selected filters.
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
