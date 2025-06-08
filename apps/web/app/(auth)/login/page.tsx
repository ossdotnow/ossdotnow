import { LoginForm } from '@/components/auth/login-form';
import { env } from '@workspace/env/server';
import { redirect } from 'next/navigation';
import Icons from '@/components/icons';

export default function Page() {
  if (env.NODE_ENV === 'production') {
    redirect('/');
  }

  return (
    <div className="relative h-svh w-full">
      <div className="absolute bottom-0 right-0 top-0 z-0 aspect-square w-full bg-transparent mix-blend-screen md:w-[1000px]">
        <img
          src="/login-background.png"
          alt="background"
          className="pointer-events-none absolute left-0 right-0 top-0 h-full object-cover object-right mix-blend-screen"
        />
      </div>
      <div className="bottom-0mx-auto absolute left-0 top-0 flex aspect-square h-full w-full max-w-7xl flex-row items-center justify-center gap-8 text-center">
        <div className="flex flex-col items-center justify-center gap-8">
          <Icons.logo className="mb-10 size-20" />
          <LoginForm className="min-w-sm" />
        </div>
      </div>
    </div>
  );
}
