'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Popover, PopoverContent, PopoverTrigger } from '@workspace/ui/components/popover';
import { Filter, Search, X } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Badge } from '@workspace/ui/components/badge';
import { parseAsString, useQueryState } from 'nuqs';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/hooks/use-trpc';
import { useState } from 'react';

export default function ProjectFilters() {
  const trpc = useTRPC();
  const [searchQuery, setSearchQuery] = useQueryState('search', parseAsString.withDefault(''));
  const [statusFilter, setStatusFilter] = useQueryState('status', parseAsString.withDefault('all'));
  const [typeFilter, setTypeFilter] = useQueryState('type', parseAsString.withDefault('all'));
  const [tagFilter, setTagFilter] = useQueryState('tag', parseAsString.withDefault('all'));
  const [sortBy, setSortBy] = useQueryState('sort', parseAsString.withDefault('name'));
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { data: projectStatuses } = useQuery(
    trpc.categories.getProjectStatuses.queryOptions({ activeOnly: true }),
  );
  const { data: projectTypes } = useQuery(
    trpc.categories.getProjectTypes.queryOptions({ activeOnly: true }),
  );
  const { data: tags } = useQuery(trpc.categories.getTags.queryOptions({ activeOnly: true }));

  const activeFiltersCount = [
    statusFilter !== 'all',
    typeFilter !== 'all',
    tagFilter !== 'all',
  ].filter(Boolean).length;

  // const clearAllFilters = () => {
  //   setSearchQuery('');
  //   setStatusFilter('all');
  //   setTypeFilter('all');
  //   setTagFilter('all');
  //   setSortBy('recent');
  // };

  return (
    <div className="sticky top-[calc(32px+65px)] z-20 mb-6 flex items-center justify-between bg-[#262626]">
      <div className="relative w-full flex-1">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-500" />
        <Input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-t-none w-full rounded-none border border-t-0 border-[#404040] bg-neutral-900 py-2.5 pr-10 pl-10 text-xs text-white placeholder-neutral-500 focus:outline-none focus-visible:ring-0 md:text-sm"
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
      <div className="flex items-center">
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 rounded-none border-t-0 border-b border-l-0 border-[#404040] bg-transparent px-2 py-2.5 text-xs text-neutral-300 hover:border-neutral-700 md:px-4 md:text-sm"
            >
              <Filter size={16} />
              <span className="hidden md:inline">Filters</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {projectStatuses?.map((status) => (
                      <SelectItem key={status.id} value={status.name}>
                        {status.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {projectTypes?.map((type) => (
                      <SelectItem key={type.id} value={type.name}>
                        {type.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Tag</label>
                <Select value={tagFilter} onValueChange={setTagFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    {tags?.map((tag) => (
                      <SelectItem key={tag.id} value={tag.name}>
                        {tag.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {activeFiltersCount > 0 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setTagFilter('all');
                    setIsFilterOpen(false);
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="border-l-none border-t-none w-10 rounded-none border border-t-0 border-l-0 border-[#404040] bg-neutral-900 px-2 py-2.5 text-xs text-neutral-300 focus:border-neutral-700 focus:outline-none md:w-32 md:px-4 md:text-sm">
            <SelectValue placeholder="Order by" className="hidden md:block" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem className="rounded-none" value="recent">
              Recent
            </SelectItem>
            <SelectItem className="rounded-none" value="stars">
              Stars
            </SelectItem>
            <SelectItem className="rounded-none" value="forks">
              Forks
            </SelectItem>
            <SelectItem className="rounded-none" value="name">
              Name (A-Z)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
