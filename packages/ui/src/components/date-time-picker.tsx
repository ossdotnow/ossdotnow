'use client';

import { CalendarIcon } from 'lucide-react';
import { parseDate } from 'chrono-node';
import * as React from 'react';

import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Calendar } from './calendar';
import { Button } from './button';
import { Label } from './label';
import { Input } from './input';

function formatDate(date: Date | undefined) {
  if (!date) return '';
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function DateTimePicker({ value, onChange }: { value?: Date; onChange?: (date?: Date) => void }) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [date, setDate] = React.useState<Date | undefined>(value);
  const [month, setMonth] = React.useState<Date | undefined>(value);

  React.useEffect(() => {
    if (value) {
      setDate(value);
      setInputValue(formatDate(value));
      setMonth(value);
    }
  }, [value]);

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="date" className="px-1">
        Schedule Date
      </Label>
      <div className="relative flex gap-2">
        <Input
          id="date"
          value={inputValue}
          placeholder="Tomorrow or next week"
          className="bg-background pr-10"
          onChange={(e) => {
            setInputValue(e.target.value);
            const parsed = parseDate(e.target.value);
            if (parsed) {
              setDate(parsed);
              setMonth(parsed);
              onChange?.(parsed);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setOpen(true);
            }
          }}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id="date-picker"
              variant="ghost"
              className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
            >
              <CalendarIcon className="size-3.5" />
              <span className="sr-only">Select date</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="end">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              onSelect={(selected) => {
                if (!selected) return;
                setDate(selected);
                setInputValue(formatDate(selected));
                setOpen(false);
                onChange?.(selected);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="text-muted-foreground px-1 text-sm">
        Your project will be launched on <span className="font-medium">{formatDate(date)}</span>.
      </div>
    </div>
  );
}

export { formatDate, DateTimePicker };
