'use client';
import { Card, CardContent } from '@workspace/ui/components/card';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@workspace/ui/lib/utils';
import { useTRPC } from '@/hooks/use-trpc';

interface ContributionDay {
  date: Date;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export function ContributionGraph({
  username,
  provider,
}: {
  username: string;
  provider: 'github' | 'gitlab';
}) {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.profile.getUserContributions.queryOptions({
      username,
      provider,
    }),
  );

  const contributions: ContributionDay[] =
    data?.days.map((day) => ({
      date: new Date(day.date),
      count: day.contributionCount,
      level: (() => {
        switch (day.contributionLevel) {
          case 'NONE':
            return 0;
          case 'FIRST_QUARTILE':
            return 1;
          case 'SECOND_QUARTILE':
            return 2;
          case 'THIRD_QUARTILE':
            return 3;
          case 'FOURTH_QUARTILE':
            return 4;
          default:
            return 0;
        }
      })(),
    })) || [];

  const getContributionGrid = () => {
    const grid: (ContributionDay | null)[][] = [];
    if (contributions.length === 0) return grid;

    const firstDay = contributions[0];
    if (!firstDay) return grid;

    const firstDayOfWeek = firstDay.date.getDay();

    for (let i = 0; i < 7; i++) {
      grid.push([]);
    }

    for (let i = 0; i < firstDayOfWeek; i++) {
      if (grid[i]) {
        grid[i]?.push(null);
      }
    }

    contributions.forEach((day) => {
      const dayOfWeek = day.date.getDay();
      if (grid[dayOfWeek]) {
        grid[dayOfWeek].push(day);
      }
    });

    const maxWeeks = Math.max(...grid.map((row) => row.length));
    grid.forEach((row) => {
      while (row.length < maxWeeks) {
        row.push(null);
      }
    });

    return grid;
  };

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const grid = getContributionGrid();
  const weeks = grid.length > 0 && grid[0] ? grid[0].length : 0;

  const getMonthColumns = () => {
    const monthCols: { month: string; colspan: number; index: number }[] = [];
    let currentMonth = -1;
    let startWeek = 0;

    for (let week = 0; week < weeks; week++) {
      let monthForWeek = -1;
      for (let day = 0; day < 7; day++) {
        const contribution = grid[day]?.[week];
        if (contribution) {
          monthForWeek = contribution.date.getMonth();
          break;
        }
      }

      if (monthForWeek !== -1 && monthForWeek !== currentMonth) {
        if (currentMonth !== -1) {
          monthCols.push({
            month: months[currentMonth] || '',
            colspan: week - startWeek,
            index: monthCols.length,
          });
        }
        currentMonth = monthForWeek;
        startWeek = week;
      }
    }

    if (currentMonth !== -1) {
      monthCols.push({
        month: months[currentMonth] || '',
        colspan: weeks - startWeek,
        index: monthCols.length,
      });
    }

    return monthCols;
  };

  const levelColors = [
    'bg-neutral-800',
    'bg-green-900/50',
    'bg-green-800/70',
    'bg-green-700',
    'bg-green-600',
  ];

  if (isLoading) {
    return (
      <Card className="rounded-none border-neutral-800 bg-neutral-900/50 p-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-8">
            <div className="text-neutral-400">Loading contribution graph...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none border-neutral-800 bg-neutral-900/50 p-0">
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-medium text-neutral-300">Contribution Activity</div>
          {data && (
            <div className="text-xs text-neutral-400">
              {data.totalContributions.toLocaleString()} contributions in the last year
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table
            className="border-separate"
            style={{ borderSpacing: '3px' }}
            role="grid"
            aria-readonly="true"
          >
            <caption className="sr-only">Contribution Graph</caption>
            <thead>
              <tr style={{ height: '13px' }}>
                <td style={{ width: '28px' }}>
                  <span className="sr-only">Day of Week</span>
                </td>
                {getMonthColumns().map((col) => (
                  <td
                    key={col.index}
                    className="relative text-xs text-neutral-400"
                    colSpan={col.colspan}
                  >
                    <span className="sr-only">{col.month}</span>
                    <span aria-hidden="true" className="absolute top-0 left-0">
                      {col.month}
                    </span>
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              {weekDays.map((dayName, dayIndex) => (
                <tr key={dayIndex} style={{ height: '10px' }}>
                  <td
                    className="relative pr-1 text-right text-xs text-neutral-400"
                    style={{ width: '28px' }}
                  >
                    <span className="sr-only">{dayName}</span>
                    <span
                      aria-hidden="true"
                      className={cn('absolute right-1', dayIndex % 2 === 0 && 'opacity-0')}
                    >
                      {dayName.slice(0, 3)}
                    </span>
                  </td>
                  {Array.from({ length: weeks }).map((_, weekIndex) => {
                    const day = grid[dayIndex]?.[weekIndex];
                    return (
                      <td
                        key={weekIndex}
                        className={cn(
                          'h-[10px] w-[10px] rounded-xs',
                          day ? levelColors[day.level] : '',
                        )}
                        style={{ width: '10px' }}
                        title={
                          day ? `${day.count} contributions on ${day.date.toDateString()}` : ''
                        }
                        role="gridcell"
                        aria-selected="false"
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 flex items-center justify-end gap-1 text-xs text-neutral-400">
            <span>Less</span>
            {levelColors.map((color, i) => (
              <div key={i} className={cn('h-[10px] w-[10px]', color)} />
            ))}
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
