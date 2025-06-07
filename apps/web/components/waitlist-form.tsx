'use client';

import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { track } from '@vercel/analytics/react';
import { useTRPC } from '@/hooks/use-trpc';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

const formSchema = z.object({
  email: z.string().email(),
});

function useWaitlistCount() {
  const trpc = useTRPC();

  const [success, setSuccess] = useState(false);

  const { mutate } = useMutation(
    trpc.earlyAccess.joinWaitlist.mutationOptions({
      onSuccess: () => {
        setSuccess(true);

        track('waitlist_join_success');
      },
      onError: () => {
        toast.error('Something went wrong. Please try again.');
        track('waitlist_join_error');
      },
    }),
  );

  return {
    mutate,
    success,
  };
}

export function WaitlistForm() {
  const { register, handleSubmit } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const waitlist = useWaitlistCount();

  function joinWaitlist({ email }: z.infer<typeof formSchema>) {
    waitlist.mutate({ email });
  }

  return waitlist.success ? (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <p className="text-lg font-semibold">You&apos;re on the waitlist! 🎉</p>
      <p className="text-[#9f9f9f]">We&apos;ll let you know when we&#39;re ready to launch.</p>
    </div>
  ) : (
    <form
      onSubmit={handleSubmit(joinWaitlist)}
      className="z-10 flex w-full items-center gap-2 px-2"
    >
      <Input
        className="z-10 rounded-none bg-[#2e2e2e]/100 text-base placeholder:text-[#9f9f9f]"
        placeholder="hello@0.email"
        {...register('email')}
      />
      <Button variant="default" className="z-10 rounded-none">
        Join Waitlist
      </Button>
    </form>
  );
}
