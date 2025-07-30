'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@/hooks/use-trpc';
import { useEffect, useRef } from 'react';

interface UseLaunchUpdatesOptions {
  projectId: string;
  enabled?: boolean;
  pollInterval?: number;
}

export function useLaunchUpdates({
  projectId,
  enabled = true,
  pollInterval = 30000,
}: UseLaunchUpdatesOptions) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: launch, isLoading } = useQuery({
    ...trpc.launches.getLaunchByProjectId.queryOptions({ projectId }),
    enabled,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === 'scheduled' && data?.launchDate) {
        const launchTime = new Date(data.launchDate).getTime();
        const now = Date.now();
        return launchTime > now ? pollInterval : false;
      }
      return false;
    },
    refetchIntervalInBackground: true,
  });
  useEffect(() => {
    if (!launch || !enabled) return;

    if (launch.status === 'scheduled' && launch.launchDate) {
      const launchTime = new Date(launch.launchDate).getTime();
      const now = Date.now();

      if (launchTime <= now) {
        queryClient.invalidateQueries({
          queryKey: trpc.launches.getLaunchByProjectId.queryKey({ projectId }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.launches.getTodayLaunches.queryKey(),
          exact: false,
        });
        queryClient.invalidateQueries({
          queryKey: trpc.launches.getYesterdayLaunches.queryKey(),
          exact: false,
        });
        queryClient.invalidateQueries({
          queryKey: trpc.launches.getAllLaunches.queryKey(),
          exact: false,
        });
      }
    }
  }, [launch, enabled, projectId, queryClient, trpc]);

  return {
    launch,
    isLoading,
    refetch: () =>
      queryClient.invalidateQueries({
        queryKey: trpc.launches.getLaunchByProjectId.queryKey({ projectId }),
      }),
  };
}
