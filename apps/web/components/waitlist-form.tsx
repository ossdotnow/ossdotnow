'use client';

import {
  useMutation,
  // useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { zodResolver } from '@hookform/resolvers/zod';
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

  const queryClient = useQueryClient();

  // const query = useQuery(trpc.earlyAccess.getWaitlistCount.queryOptions());

  const [success, setSuccess] = useState(false);

  const { mutate } = useMutation(
    trpc.earlyAccess.joinWaitlist.mutationOptions({
      onSuccess: () => {
        setSuccess(true);

        // queryClient.setQueryData([trpc.earlyAccess.getWaitlistCount.queryKey()], {
        //   count: (query.data?.count ?? 0) + 1,
        // });
      },
      onError: () => {
        toast.error('Something went wrong. Please try again.');
      },
    }),
  );

  return {
    // count: query.data?.count ?? 0,
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

  return (
    <form
      onSubmit={handleSubmit(joinWaitlist)}
      className="z-10 flex w-full items-center gap-2 px-2"
    >
      <Input
        className="z-10 rounded-none bg-[#2e2e2e]/100 placeholder:text-[#9f9f9f]"
        placeholder="hello@0.email"
        {...register('email')}
      />
      <Button variant="default" className="z-10 rounded-none">
        Join Waitlist
      </Button>
    </form>
  );
}
