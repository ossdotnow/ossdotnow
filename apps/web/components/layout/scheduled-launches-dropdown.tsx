'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { format, formatDistanceToNow } from 'date-fns';
import { useCountdown } from '@/hooks/use-countdown';
import Link from '@workspace/ui/components/link';
import { useTRPC } from '@/hooks/use-trpc';
import { useEffect } from 'react';


function ScheduledLaunchItem({ launch }: { launch: any }) {
  const { timeRemaining, isExpired } = useCountdown(launch.launchDate);
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  useEffect(() => {
    if (isExpired) {
      queryClient.invalidateQueries({
        queryKey: trpc.launches.getUserScheduledLaunches.queryKey(),
      });
    }
  }, [isExpired, queryClient, trpc]);
  if (isExpired) {
    return null;
  }

  return (
    <DropdownMenuItem asChild className="p-0">
      <Link
        href={`/launches/${launch.id}`}
        className="block rounded-none px-3 py-3 hover:bg-neutral-800"
      >
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="truncate font-medium text-white">{launch.name}</span>
            <ExternalLink className="ml-2 h-3 w-3 flex-shrink-0 text-neutral-500" />
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs text-neutral-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(launch.launchDate), 'MMM d')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{format(new Date(launch.launchDate), 'h:mm a')}</span>
            </div>
            <span className="font-medium text-orange-400">{timeRemaining}</span>
          </div>
        </div>
      </Link>
    </DropdownMenuItem>
  );
}

export function ScheduledLaunchesModal() {
  const trpc = useTRPC();

  const { data: scheduledLaunches, isLoading } = useQuery({
    ...trpc.launches.getUserScheduledLaunches.queryOptions(),
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });
  const activeLaunches =
    scheduledLaunches?.filter((launch) => {
      const launchTime = new Date(launch.launchDate).getTime();
      return launchTime > Date.now();
    }) || [];

  if (!isLoading && activeLaunches.length === 0) {
    return null;
  }
  if (isLoading) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative rounded-none border-0 p-2 text-sm text-neutral-400 hover:bg-neutral-900 hover:text-white focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          title={`${activeLaunches.length} scheduled launch${activeLaunches.length !== 1 ? 'es' : ''}`}
        >
          <Clock className="h-4 w-4" />
          {activeLaunches.length > 0 && (
            <div className="absolute top-1 right-1 flex h-1 w-1 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="max-w-96 min-w-80 rounded-none border-neutral-800 bg-neutral-900"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="flex items-center gap-2 px-3 py-2">
          <Clock className="h-4 w-4" />
          Scheduled Launches ({activeLaunches.length})
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-neutral-800" />

        <div className="max-h-80 overflow-y-auto">
          {activeLaunches.length > 0 ? (
            activeLaunches.map((launch) => <ScheduledLaunchItem key={launch.id} launch={launch} />)
          ) : (
            <div className="px-3 py-6 text-center">
              <Clock className="mx-auto mb-2 h-8 w-8 text-neutral-600" />
              <p className="text-sm text-neutral-400">No scheduled launches</p>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
