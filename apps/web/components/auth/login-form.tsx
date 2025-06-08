'use client';

import { Form, FormField } from '@workspace/ui/components/form';
import { Separator } from '@workspace/ui/components/separator';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { ComponentProps, FC, useState } from 'react';
import { authClient } from '@workspace/auth/client';
import { cn } from '@workspace/ui/lib/utils';
import { ProviderId } from '@/lib/constants';
import { useForm } from 'react-hook-form';
import Icons from '@/components/icons';
import { loginForm } from '@/forms';
import { toast } from 'sonner';
import Link from 'next/link';
import { z } from 'zod';

const LoginForm: FC<ComponentProps<'div'> & { redirectUrl?: string }> = ({
  className,
  redirectUrl = '/profile',
  ...props
}) => {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof loginForm>>({
    resolver: zodResolver(loginForm),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signInWithProvider = async (providerId: ProviderId) => {
    await authClient.signIn.social(
      {
        provider: providerId,
        callbackURL: redirectUrl,
      },
      {
        onRequest: () => {
          toast.loading(`Redirecting to ${providerId}...`);
        },
        onResponse: () => {
          toast.success('Signed in successfully');
        },
      },
    );
  };

  return (
    <div
      className={cn('z-10 flex w-full max-w-sm flex-col items-center gap-6', className)}
      {...props}
    >
      {/* <Form {...form}>
        <form className="min-w-sm flex flex-col gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <Input
                type="email"
                placeholder="Email"
                className="border-border rounded-none border !bg-[#1D1D1D]/100 text-base placeholder:text-[#9f9f9f]"
                {...field}
              />
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <Input
                type="password"
                placeholder="Password"
                className="border-border rounded-none border !bg-[#1D1D1D]/100 text-base placeholder:text-[#9f9f9f]"
                {...field}
              />
            )}
          />
          <Button type="submit" className="rounded-none text-base">
            Login
          </Button>

          <p className="text-sm text-[#9f9f9f]">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="py-2 font-medium text-white">
              Register
            </Link>
          </p>
        </form>
      </Form>

      <div className="flex w-full max-w-sm flex-row items-center gap-2">
        <Separator className="h-[2px] bg-[#2e2e2e]/100" orientation="horizontal" />
        <span className="text-sm text-[#9f9f9f]">or</span>
        <Separator className="h-[2px] bg-[#2e2e2e]/100" orientation="horizontal" />
      </div> */}

      <div className="flex w-full flex-col gap-2">
        <Button
          type="button"
          className="border-border rounded-none border py-2 text-base transition-all"
          variant="outline"
          onClick={() => signInWithProvider('github')}
        >
          <Icons.github className="h-4 w-4 fill-white" /> Login with Github
        </Button>
      </div>
    </div>
  );
};

export default LoginForm;
