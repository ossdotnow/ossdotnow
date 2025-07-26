'use client';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { CalendarIcon } from 'lucide-react';
import { parseDate } from 'chrono-node';
import { Calendar } from './calendar';
import { Button } from './button';
import { Label } from './label';
import { Input } from './input';
import * as React from 'react';

function formatDate(date: Date | undefined) {
  if (!date) return '';
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function DateTimePicker({
  value,
  onChange,
  time,
  onTimeChange,
}: {
  value?: Date;
  onChange?: (date?: Date) => void;
  time: string;
  onTimeChange: (value: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [date, setDate] = React.useState<Date | undefined>(value);
  const [month, setMonth] = React.useState<Date | undefined>(value || new Date());

  const today = React.useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const maxYear = currentYear + 10;

  const fromMonth = new Date(currentYear, currentMonth);

  const isToday = React.useMemo(() => {
    if (!date) return false;
    const selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return selectedDate.getTime() === today.getTime();
  }, [date, today]);

  const currentTime = React.useMemo(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  }, []);

  React.useEffect(() => {
    if (value) {
      setDate(value);
      setInputValue(formatDate(value));
      setMonth(value);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    setInputValue(inputVal);

    if (inputVal.trim() === '') {
      setDate(undefined);
      onChange?.(undefined);
      return;
    }

    const parsed = parseDate(inputVal);
    if (parsed) {
      const parsedDate = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
      if (parsedDate >= today) {
        setDate(parsed);
        setMonth(parsed);
        onChange?.(parsed);
      }
    }
  };

  const handleDateSelect = (selected: Date | undefined) => {
    if (!selected) return;

    const selectedDate = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate());
    if (selectedDate < today) return;

    setDate(selected);
    setInputValue(formatDate(selected));
    setOpen(false);
    onChange?.(selected);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;

    if (isToday && newTime < currentTime) {
      return;
    }

    onTimeChange(newTime);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Input
            id="date"
            value={inputValue}
            placeholder="Select launch date"
            className="bg-background pr-10"
            onChange={handleInputChange}
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
                onSelect={handleDateSelect}
                disabled={(date) => {
                  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                  return checkDate < today;
                }}
                fromDate={today}
                toDate={new Date(maxYear, 11, 31)}
                fromMonth={fromMonth}
                toMonth={new Date(maxYear, 11)}
                fromYear={currentYear}
                toYear={maxYear}
                defaultMonth={today}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="w-32">
          <Input
            id="time"
            type="time"
            value={time}
            onChange={handleTimeChange}
            min={isToday ? currentTime : undefined}
            className="bg-background"
          />
        </div>
      </div>

      {date && (
        <div className="text-muted-foreground px-1 text-sm">
          Your project will be launched on <span className="font-medium">{formatDate(date)}</span>
          {time && (
            <span>
              {' '}
              at <span className="font-medium">{time}</span>
            </span>
          )}
          .
        </div>
      )}
    </div>
  );
}

export { formatDate, DateTimePicker };
