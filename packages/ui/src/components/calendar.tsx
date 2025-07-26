'use client';
import { cn } from '@workspace/ui/lib/utils';
import { DayPicker } from 'react-day-picker';
import * as React from 'react';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-0', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-between items-center relative px-0 mb-4',
        caption_label: 'text-sm font-medium sr-only',
        caption_dropdowns: 'flex gap-2 items-center absolute left-1/2 transform -translate-x-1/2',
        dropdown_month: 'px-3 py-1',
        dropdown_year: 'px-3 py-1',
        dropdown: 'px-3 py-1 bg-background border border-input rounded-md',
        nav: 'flex justify-between items-center w-full absolute inset-0 pointer-events-none',
        nav_button:
          'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 w-7 pointer-events-auto',
        nav_button_previous: 'absolute left-0 top-0',
        nav_button_next: 'absolute right-0 top-0',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: cn('text-center text-sm p-0 relative'),
        day: cn(
          'h-9 w-9 p-0 font-normal rounded-md transition-colors',
          'text-center leading-9',
          'hover:bg-accent/50 hover:text-accent-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-30',
          'aria-selected:bg-primary aria-selected:text-primary-foreground',
          'aria-selected:hover:bg-primary/90 aria-selected:hover:text-primary-foreground',
        ),
        day_selected:
          'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
        day_today: 'bg-accent text-accent-foreground font-semibold',
        day_disabled: 'text-muted-foreground opacity-30',
        ...classNames,
      }}
      {...props}
    />
  );
}

export { Calendar };
