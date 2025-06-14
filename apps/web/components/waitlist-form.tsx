'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, FormField } from '@workspace/ui/components/form';
import { ComponentProps, useEffect, useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { track } from '@vercel/analytics/react';
import { cn } from '@workspace/ui/lib/utils';
import NumberFlow from '@number-flow/react';
import { useTRPC } from '@/hooks/use-trpc';
import { useForm } from 'react-hook-form';
import { waitlistForm } from '@/forms';
import { toast } from 'sonner';
import { z } from 'zod/v4';

function useWaitlistCount() {
  const trpc = useTRPC();
  const [isMounted, setIsMounted] = useState(false);
  const [success, setSuccess] = useState(false);
  const queryClient = useQueryClient();
  const query = useQuery(trpc.earlyAccess.getWaitlistCount.queryOptions());

  useEffect(() => {
    setIsMounted(true);
    setSuccess(localStorage.getItem('waitlist-joined') === 'true');
  }, []);

  const { mutate } = useMutation(
    trpc.earlyAccess.joinWaitlist.mutationOptions({
      onSuccess: () => {
        setSuccess(true);
        queryClient.setQueryData([trpc.earlyAccess.getWaitlistCount.queryKey()], {
          count: (query.data?.count ?? 0) + 1,
        });

        if (isMounted) {
          localStorage.setItem('waitlist-joined', 'true');
        }
        track('waitlist_join_success');
      },
      onError: () => {
        toast.error('Something went wrong. Please try again.');
        track('waitlist_join_error');
      },
    }),
  );

  return {
    count: query.data?.count ?? 0,
    mutate,
    success,
  };
}

export function WaitlistForm({ className, ...props }: ComponentProps<'div'>) {
  const form = useForm<z.infer<typeof waitlistForm>>({
    resolver: zodResolver(waitlistForm),
    defaultValues: {
      email: '',
    },
  });

  const waitlist = useWaitlistCount();

  function joinWaitlist({ email }: z.infer<typeof waitlistForm>) {
    waitlist.mutate({ email });
  }

  return waitlist.success ? (
    <div
      className={cn('flex flex-col items-center justify-center gap-4 text-center', className)}
      {...props}
    >
      <p className="text-lg font-semibold">You&apos;re on the waitlist! 🎉</p>
      <p className="text-[#9f9f9f]">We&apos;ll let you know when we&#39;re ready to launch.</p>
    </div>
  ) : (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center gap-4 text-center',
        className,
      )}
      {...props}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(joinWaitlist)}
          className="z-10 flex w-full max-w-[28.75rem] items-center gap-3 px-2"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <Input
                className="border-border z-10 rounded-none border !bg-[#1D1D1D]/100 text-base placeholder:text-[#9f9f9f]"
                placeholder="hello@0.email"
                {...field}
              />
            )}
          />

          <Button type="submit" variant="default" className="z-10 rounded-none">
            Join Waitlist
          </Button>
        </form>
      </Form>

      <div className="relative flex flex-row items-center justify-center gap-2">
        <span className="size-2 animate-pulse rounded-full bg-green-600 dark:bg-green-400" />
        <span className="blur-xs absolute left-0 size-2 animate-pulse rounded-full bg-green-600 dark:bg-green-400" />
        <span className="text-sm">
          <NumberFlow value={waitlist.count} /> people already joined
        </span>
      </div>
    </div>
  );
}
