'use client';

import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Filter, Search, X } from 'lucide-react';
import React, { useState } from 'react';

export default function ProjectFilters() {
  const [searchQuery, setSearchQuery] = useState('');
  return (
    <div className="sticky top-[calc(32px+66px)] z-20 mb-8 flex items-center justify-between bg-[#262626]">
      <div className="relative w-full flex-1">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-500" />
        <Input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-t-none w-full rounded-none border border-t-0 border-[#404040] bg-neutral-900 py-2.5 pr-10 pl-10 text-sm text-white placeholder-neutral-500 focus:border-neutral-700 focus:outline-none"
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
        <Button
          variant="outline"
          className="flex items-center gap-2 rounded-none border-t-0 border-b border-l-0 border-[#404040] bg-transparent px-4 py-2.5 text-sm text-neutral-300 hover:border-neutral-700"
        >
          <Filter size={16} />
          Filters
        </Button>
        <Select>
          <SelectTrigger className="border-l-none border-t-none w-30 rounded-none border border-t-0 border-l-0 border-[#404040] bg-neutral-900 px-4 py-2.5 text-sm text-neutral-300 focus:border-neutral-700 focus:outline-none">
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
  );
}
