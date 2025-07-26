'use client';

import { cn } from '@workspace/ui/lib/utils';
import { DayPicker } from 'react-day-picker';
import * as React from 'react';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'space-x-1 flex items-center',
        nav_button: 'h-7 w-7 bg-muted hover:bg-accent text-foreground rounded-md',
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: cn('text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent'),
        day: cn(
          'h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-accent/80 focus:outline-none focus:ring-2 focus:ring-ring',
        ),
        day_selected: 'bg-primary text-primary-foreground hover:bg-primary/90',
        day_today: 'border border-accent text-accent-foreground',
        ...classNames,
      }}
      {...props}
    />
  );
}

export { Calendar };
