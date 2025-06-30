import { Button } from '@workspace/ui/components/button';
import Icons from '@workspace/ui/components/icons';
import Link from '@workspace/ui/components/link';
import { auth } from '@workspace/auth/server';
import { cn } from '@workspace/ui/lib/utils';
import { env } from '@workspace/env/server';
import { headers } from 'next/headers';
import PublicNav from './public-nav';
import UserNav from './user-nav';
import TempNav from './temp-nav';

export async function SiteHeader() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <header className="sticky top-8 z-50 mx-6 max-w-[1080px] border border-[#404040] bg-black md:mx-auto">
      <div className={cn('mx-auto flex h-16 items-center justify-between px-4')}>
        <Link href="/" className="flex items-center gap-2" event="home_nav_click">
          <Icons.logo className="size-6 sm:size-7" />
          <span className="text-lg font-medium text-white sm:text-xl">oss.now</span>
        </Link>
        <nav className="flex items-center gap-2">
          {env.VERCEL_ENV === 'production' ? <TempNav /> : <PublicNav />}
          {session?.user.id ? (
            <UserNav />
          ) : (
            <Button
              className="ml-4 rounded-none border border-neutral-800 bg-transparent px-4 py-2 text-sm text-white hover:border-neutral-700 hover:bg-neutral-900"
              asChild
            >
              <Link href="/login" event="login_nav_click">
                login
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
