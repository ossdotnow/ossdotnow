'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Suspense, useEffect, useState } from 'react';
import { Card } from '@workspace/ui/components/card';
import { Calendar, TrendingUp } from 'lucide-react';
import { parseAsString, useQueryState } from 'nuqs';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/hooks/use-trpc';
import LaunchCard from './launch-card';

function LaunchesPage() {
  const trpc = useTRPC();
  const [tab, setTab] = useQueryState('tab', parseAsString.withDefault('today'));
  const [showShadow, setShowShadow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowShadow(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: todayLaunches, isLoading: todayLoading } = useQuery(
    trpc.launches.getTodayLaunches.queryOptions({ limit: 50 }),
  );

  const { data: yesterdayLaunches, isLoading: yesterdayLoading } = useQuery(
    trpc.launches.getYesterdayLaunches.queryOptions({ limit: 50 }),
  );

  const { data: allLaunches, isLoading: allLoading } = useQuery(
    trpc.launches.getAllLaunches.queryOptions({ limit: 50 }),
  );

  // const handleShare = async (project: any) => {
  //   const url = `${window.location.origin}/launches/${project.id}`;

  //   if (navigator.share) {
  //     try {
  //       await navigator.share({
  //         title: project.name,
  //         text: project.tagline,
  //         url,
  //       });
  //     } catch (error) {
  //       console.error('Error sharing:', error);
  //     }
  //   } else {
  //     await navigator.clipboard.writeText(url);
  //     toast.success('Link copied to clipboard!');
  //   }
  // };

  // // TODO: fix this
  // // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // const handleShareOnX = async (project: any) => {
  //   const url = `${window.location.origin}/launches/${project.id}`;
  //   const text = `Check out ${project.name} - ${project.tagline}`;
  //   const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  //   window.open(xUrl, '_blank');
  // };

  return (
    <div className="px-6">
      <div
        className={`pointer-events-none fixed top-[calc(32px+65px+36px)] z-10 h-10 w-full bg-gradient-to-b from-[#101010] to-transparent transition-all duration-300 ${
          showShadow ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div className="fixed top-0 right-0 left-0 z-10 h-[32px] bg-[#101010]" />
      <div className="mx-auto min-h-screen max-w-[1080px] pt-20">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="fixed top-[calc(32px+65px)] z-10 mb-6 flex w-full max-w-[1080px] rounded-none border border-t-0 border-[#404040] bg-[#262626]">
            <TabsTrigger
              value="today"
              className="flex shrink items-center gap-2 rounded-none data-[state=active]:!bg-neutral-900/60"
            >
              <Calendar className="h-4 w-4" />
              Today
            </TabsTrigger>
            <TabsTrigger
              value="yesterday"
              className="flex shrink items-center gap-2 rounded-none data-[state=active]:!bg-neutral-900/60"
            >
              <TrendingUp className="h-4 w-4" />
              Yesterday
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="flex shrink items-center gap-2 rounded-none data-[state=active]:!bg-neutral-900/60"
            >
              <TrendingUp className="h-4 w-4" />
              All Launches
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            {todayLoading ? (
              <div className="py-12 text-center">
                <p className="text-neutral-400">Loading today&apos;s launches...</p>
              </div>
            ) : todayLaunches && todayLaunches.length > 0 ? (
              <>
                {todayLaunches[0] && <LaunchCard project={todayLaunches[0]} />}
                {todayLaunches.slice(1).map((project, index) => (
                  <LaunchCard key={project.id} project={project} index={index + 1} />
                ))}
              </>
            ) : (
              <Card className="rounded-none p-12 text-center">
                <p className="text-neutral-400">No launches today yet.</p>
                <p className="mt-2 text-sm text-neutral-500">
                  Be the first to launch your project!
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="yesterday" className="space-y-4">
            {yesterdayLoading ? (
              <div className="py-12 text-center">
                <p className="text-neutral-400">Loading yesterday&apos;s launches...</p>
              </div>
            ) : yesterdayLaunches && yesterdayLaunches.length > 0 ? (
              <>
                {yesterdayLaunches[0] && <LaunchCard project={yesterdayLaunches[0]} />}
                {yesterdayLaunches.slice(1).map((project, index) => (
                  <LaunchCard key={project.id} project={project} index={index + 1} />
                ))}
              </>
            ) : (
              <Card className="rounded-none p-12 text-center">
                <p className="text-neutral-400">No launches yesterday.</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {allLoading ? (
              <div className="py-12 text-center">
                <p className="text-neutral-400">Loading all launches...</p>
              </div>
            ) : allLaunches && allLaunches.length > 0 ? (
              <>
                {allLaunches[0] && <LaunchCard project={allLaunches[0]} />}
                {allLaunches.slice(1).map((project, index) => (
                  <LaunchCard key={project.id} project={project} index={index + 1} />
                ))}
              </>
            ) : (
              <Card className="rounded-none p-12 text-center">
                <p className="text-neutral-400">No launches yet.</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function LaunchesPageSuspense() {
  return (
    <Suspense>
      <LaunchesPage />
    </Suspense>
  );
}
