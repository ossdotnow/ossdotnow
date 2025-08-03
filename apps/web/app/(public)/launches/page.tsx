'use client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Suspense, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@workspace/ui/components/card';
import { parseAsString, useQueryState } from 'nuqs';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/hooks/use-trpc';
import LaunchCard from './launch-card';

interface Launch {
  id: string;
  name: string;
  tagline?: string;
  description?: string | null;
  logoUrl?: string | null;
  gitRepoUrl?: string;
  gitHost?: string | null;
  type?: string | null;
  status?: string | null;
  launchDate: Date;
  featured?: boolean;
  owner?: {
    id: string;
    name: string;
    username: string;
    image: string;
  } | null;
  voteCount: number;
  commentCount: number;
  tags: string[];
  hasVoted: boolean;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getWeekDates(year: number, week: number): { start: Date; end: Date } {
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() || 7; // Monday = 1, Sunday = 7

  const week1Start = new Date(jan4);
  week1Start.setDate(jan4.getDate() - jan4Day + 1);

  const weekStart = new Date(week1Start);
  weekStart.setDate(week1Start.getDate() + (week - 1) * 7);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { start: weekStart, end: weekEnd };
}

const ErrorDisplay = ({ error, retry }: { error: unknown; retry?: () => void }) => (
  <Card className="rounded-none p-12 text-center">
    <p className="text-red-400">Something went wrong</p>
    <p className="mt-2 text-sm text-neutral-500">
      {error instanceof Error ? error.message : 'An unexpected error occurred'}
    </p>
    {retry && (
      <button
        onClick={retry}
        className="mt-4 rounded border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
      >
        Try Again
      </button>
    )}
  </Card>
);

function LaunchesPage() {
  const trpc = useTRPC();
  const currentWeek = getWeekNumber(new Date());
  const currentYear = new Date().getFullYear();

  const [tab, setTab] = useQueryState('tab', parseAsString.withDefault('today'));
  const [selectedWeek, setSelectedWeek] = useQueryState(
    'week',
    parseAsString.withDefault(currentWeek.toString()),
  );
  const selectedWeekNum = Math.max(1, parseInt(selectedWeek, 10) || currentWeek);
  const [showShadow, setShowShadow] = useState(false);
  const weekSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowShadow(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (tab === 'all') {
      const urlParams = new URLSearchParams(window.location.search);
      if (!urlParams.has('week')) {
        setSelectedWeek(currentWeek.toString());
      }
    }
  }, [tab, currentWeek, setSelectedWeek]);

  const weekOptions = useMemo(() => {
    const totalWeeksToShow = currentWeek + 4;
    return Array.from({ length: totalWeeksToShow }, (_, i) => {
      const weekNum = i + 1;
      const { start, end } = getWeekDates(currentYear, weekNum);
      return { weekNum, start, end };
    });
  }, [currentWeek, currentYear]);

  const scrollToSelectedWeek = useCallback(() => {
    if (weekSelectorRef.current && tab === 'all') {
      const selectedWeekElement = weekSelectorRef.current.querySelector(
        `[data-week="${selectedWeekNum}"]`,
      ) as HTMLElement;

      if (selectedWeekElement && weekSelectorRef.current.clientWidth > 0) {
        const container = weekSelectorRef.current;
        const containerWidth = container.clientWidth;
        const elementLeft = selectedWeekElement.offsetLeft;
        const elementWidth = selectedWeekElement.clientWidth;

        const scrollLeft = elementLeft - containerWidth / 2 + elementWidth / 2;

        const maxScrollLeft = Math.max(0, container.scrollWidth - containerWidth);
        const finalScrollLeft = Math.max(0, Math.min(scrollLeft, maxScrollLeft));

        container.scrollTo({
          left: finalScrollLeft,
          behavior: 'smooth',
        });
      }
    }
  }, [selectedWeekNum, tab]);

  useEffect(() => {
    if (tab === 'all') {
      const timeoutId = setTimeout(() => {
        scrollToSelectedWeek();
      }, 200);

      return () => clearTimeout(timeoutId);
    }
  }, [tab, scrollToSelectedWeek]);

  useEffect(() => {
    if (tab === 'all') {
      const timeoutId = setTimeout(scrollToSelectedWeek, 150);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedWeekNum, tab, scrollToSelectedWeek]);

  const {
    data: todayLaunches,
    isLoading: todayLoading,
    error: todayError,
    refetch: refetchToday,
  } = useQuery({
    ...trpc.launches.getTodayLaunches.queryOptions({ limit: 50 }),
    refetchInterval: 60000,
    refetchIntervalInBackground: true,
    enabled: tab === 'today',
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const {
    data: yesterdayLaunches,
    isLoading: yesterdayLoading,
    error: yesterdayError,
    refetch: refetchYesterday,
  } = useQuery({
    ...trpc.launches.getYesterdayLaunches.queryOptions({ limit: 50 }),
    refetchInterval: 60000,
    refetchIntervalInBackground: true,
    enabled: tab === 'yesterday',
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const { start: thisWeekStart, end: thisWeekEnd } = getWeekDates(currentYear, currentWeek);
  const {
    data: thisWeekLaunchesData,
    isLoading: thisWeekLoading,
    error: thisWeekError,
    refetch: refetchThisWeek,
  } = useQuery({
    ...trpc.launches.getLaunchesByDateRange.queryOptions({
      startDate: thisWeekStart,
      endDate: thisWeekEnd,
      limit: 100,
      status: 'live',
    }),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
    enabled: tab === 'thisweek',
    retry: 2,
  });

  const { start: selectedWeekStart, end: selectedWeekEnd } = getWeekDates(
    currentYear,
    selectedWeekNum,
  );
  const {
    data: allLaunchesData,
    isLoading: allLoading,
    error: allError,
    refetch: refetchAll,
  } = useQuery({
    ...trpc.launches.getLaunchesByDateRange.queryOptions({
      startDate: selectedWeekStart,
      endDate: selectedWeekEnd,
      limit: 100,
      status: 'live',
    }),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
    enabled: tab === 'all',
    retry: 2,
  });

  const thisWeekLaunches = (thisWeekLaunchesData?.data || []).sort(
    (a, b) => b.voteCount - a.voteCount,
  );
  const allLaunches = (allLaunchesData?.data || []).sort((a, b) => b.voteCount - a.voteCount);

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
          <TabsList className="fixed top-[calc(32px+65px)] z-10 mb-6 flex w-full max-w-[calc(100vw-3rem)] rounded-none border border-t-0 border-[#404040] bg-[#262626] lg:max-w-[1080px]">
            <TabsTrigger
              value="today"
              className="flex flex-1 shrink items-center justify-center gap-1 rounded-none px-2 text-xs data-[state=active]:!bg-neutral-900/60 sm:gap-2 sm:px-4 sm:text-sm md:text-base"
            >
              <span>Today</span>
            </TabsTrigger>
            <TabsTrigger
              value="yesterday"
              className="flex flex-1 shrink items-center justify-center gap-1 rounded-none px-2 text-xs data-[state=active]:!bg-neutral-900/60 sm:gap-2 sm:px-4 sm:text-sm md:text-base"
            >
              <span>Yesterday</span>
            </TabsTrigger>
            <TabsTrigger
              value="thisweek"
              className="flex flex-1 shrink items-center justify-center gap-1 rounded-none px-2 text-xs data-[state=active]:!bg-neutral-900/60 sm:gap-2 sm:px-4 sm:text-sm md:text-base"
            >
              <span>This Week</span>
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="flex flex-1 shrink items-center justify-center gap-1 rounded-none px-2 text-xs data-[state=active]:!bg-neutral-900/60 sm:gap-2 sm:px-4 sm:text-sm md:text-base"
            >
              <span>All Launches</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            {todayError ? (
              <ErrorDisplay error={todayError} retry={refetchToday} />
            ) : todayLoading ? (
              <div className="py-12 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-neutral-600 border-t-neutral-300" />
                <p className="mt-4 text-neutral-400">Loading today&apos;s launches...</p>
              </div>
            ) : todayLaunches && todayLaunches.length > 0 ? (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {todayLaunches.map((project, index) => (
                    <motion.div
                      key={project.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{
                        layout: {
                          duration: 0.5,
                          ease: [0.4, 0, 0.2, 1],
                          type: 'tween',
                        },
                        opacity: { duration: 0.3 },
                        y: { duration: 0.3 },
                      }}
                    >
                      <LaunchCard project={project} index={index} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
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
            {yesterdayError ? (
              <ErrorDisplay error={yesterdayError} retry={refetchYesterday} />
            ) : yesterdayLoading ? (
              <div className="py-12 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-neutral-600 border-t-neutral-300" />
                <p className="mt-4 text-neutral-400">Loading yesterday&apos;s launches...</p>
              </div>
            ) : yesterdayLaunches && yesterdayLaunches.length > 0 ? (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {yesterdayLaunches.map((project, index) => (
                    <motion.div
                      key={project.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{
                        layout: {
                          duration: 0.5,
                          ease: [0.4, 0, 0.2, 1],
                          type: 'tween',
                        },
                        opacity: { duration: 0.3 },
                        y: { duration: 0.3 },
                      }}
                    >
                      <LaunchCard project={project} index={index} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <Card className="rounded-none p-12 text-center">
                <p className="text-neutral-400">No launches yesterday.</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="thisweek" className="space-y-4">
            {thisWeekError ? (
              <ErrorDisplay error={thisWeekError} retry={refetchThisWeek} />
            ) : thisWeekLoading ? (
              <div className="py-12 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-neutral-600 border-t-neutral-300" />
                <p className="mt-4 text-neutral-400">Loading this week&apos;s launches...</p>
              </div>
            ) : thisWeekLaunches && thisWeekLaunches.length > 0 ? (
              <>
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {thisWeekLaunches.map((project: Launch, index: number) => (
                      <motion.div
                        key={project.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                          layout: {
                            duration: 0.5,
                            ease: [0.4, 0, 0.2, 1],
                            type: 'tween',
                          },
                          opacity: { duration: 0.3 },
                          y: { duration: 0.3 },
                        }}
                      >
                        <LaunchCard project={project} index={index} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <Card className="rounded-none p-12 text-center">
                <p className="text-neutral-400">No launches this week yet.</p>
                <p className="mt-2 text-sm text-neutral-500">
                  Be the first to launch your project this week!
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {/* Week Selector */}
            <div className="sticky top-[calc(32px+65px+32px)] z-10 bg-[#101010] pb-2">
              <div className="mb-2">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-neutral-300 sm:text-base">Select Week</h3>
                  {/* Time Period Selector Dropdown */}
                  <Select value="week" disabled>
                    <SelectTrigger className="h-8 w-25 rounded-none border-neutral-700 bg-neutral-900/50 text-xs font-medium text-neutral-300 hover:bg-neutral-800/70 sm:h-9 sm:w-28 sm:text-sm">
                      <SelectValue placeholder="By Week" />
                    </SelectTrigger>
                    <SelectContent className="border-neutral-700 bg-neutral-900">
                      <SelectItem value="week" className="text-neutral-300">
                        By Week
                      </SelectItem>
                      <SelectItem value="month" className="text-neutral-500" disabled>
                        By Month
                      </SelectItem>
                      <SelectItem value="year" className="text-neutral-500" disabled>
                        By Year
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Horizontal Week Scroller */}
                <div className="relative">
                  <div className="pointer-events-none absolute top-0 left-0 z-10 h-full w-4 bg-gradient-to-r from-[#101010] via-[#101010]/80 to-transparent sm:w-8" />
                  <div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-4 bg-gradient-to-l from-[#101010] via-[#101010]/80 to-transparent sm:w-8" />

                  <div
                    ref={weekSelectorRef}
                    className="scrollbar-hide flex gap-0.5 overflow-x-auto scroll-smooth pb-2 sm:gap-1"
                    role="tablist"
                    aria-label="Week selector"
                  >
                    {weekOptions.map(({ weekNum, start, end }) => {
                      const isSelected = weekNum === selectedWeekNum;
                      const isCurrent = weekNum === currentWeek;
                      const isFuture = weekNum > currentWeek;

                      let dateRange = '';
                      try {
                        const startDate = start.getDate();
                        const endDate = end.getDate();
                        const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
                        const endMonth = end.toLocaleDateString('en-US', { month: 'short' });

                        dateRange =
                          startMonth === endMonth
                            ? `${startMonth} ${startDate}-${endDate}`
                            : `${startMonth} ${startDate} - ${endMonth} ${endDate}`;
                      } catch {
                        dateRange = `Week ${weekNum}`;
                      }

                      return (
                        <button
                          key={weekNum}
                          data-week={weekNum}
                          onClick={() => {
                            if (!isFuture) {
                              setSelectedWeek(weekNum.toString());
                            }
                          }}
                          role="tab"
                          aria-selected={isSelected}
                          aria-label={`Week ${weekNum}, ${dateRange}`}
                          disabled={isFuture}
                          className={`min-w-[80px] flex-shrink-0 border px-2 py-1.5 text-xs transition-colors sm:min-w-[100px] sm:px-3 sm:py-2 ${
                            isSelected
                              ? 'border-neutral-400 bg-neutral-700 text-neutral-100 shadow-sm'
                              : isCurrent
                                ? 'border-cyan-600/50 bg-cyan-900/20 text-cyan-300 hover:border-cyan-500 hover:bg-cyan-800/30'
                                : isFuture
                                  ? 'cursor-not-allowed border-neutral-800 bg-neutral-900/20 text-neutral-500 opacity-50'
                                  : 'cursor-pointer border-neutral-700 bg-neutral-900/50 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-800/70'
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-[10px] font-medium sm:text-xs">
                              Week {weekNum}
                              {isSelected && !isCurrent && (
                                <span className="ml-1 text-cyan-400">✓</span>
                              )}
                              {isCurrent && <span className="ml-1 text-cyan-400">•</span>}
                            </div>
                            <div className="text-[9px] text-neutral-400 sm:text-[10px]">
                              {dateRange}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {allError ? (
              <ErrorDisplay error={allError} retry={refetchAll} />
            ) : allLoading ? (
              <div className="py-4 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-neutral-600 border-t-neutral-300" />
                <p className="mt-4 text-neutral-400">
                  Loading launches for week {selectedWeekNum}...
                </p>
              </div>
            ) : allLaunches && allLaunches.length > 0 ? (
              <>
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {allLaunches.map((project: Launch, index: number) => (
                      <motion.div
                        key={project.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                          layout: {
                            duration: 0.5,
                            ease: [0.4, 0, 0.2, 1],
                            type: 'tween',
                          },
                          opacity: { duration: 0.3 },
                          y: { duration: 0.3 },
                        }}
                      >
                        <LaunchCard project={project} index={index} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <Card className="rounded-none p-12 text-center">
                <p className="text-neutral-400">No launches for week {selectedWeekNum}.</p>
                <p className="mt-2 text-sm text-neutral-500">
                  {selectedWeekNum === currentWeek
                    ? 'Be the first to launch your project this week!'
                    : 'No projects were launched during this week.'}
                </p>
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
