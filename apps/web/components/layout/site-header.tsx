import { Button } from '@workspace/ui/components/button';
import { auth } from '@workspace/auth/server';
import { cn } from '@workspace/ui/lib/utils';
import { env } from '@workspace/env/server';
import Icons from '@/components/icons';
import { headers } from 'next/headers';
import PublicNav from './public-nav';
import UserNav from './user-nav';
import TempNav from './temp-nav';
import Link from '../link';

export async function SiteHeader() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <header className="sticky top-0 z-50 w-full bg-[#101010]">
      <div
        className={cn(
          'border-border mx-auto flex h-16 items-center justify-between border-b border-l border-r px-4 sm:px-8',
          session?.user.id ? 'w-full' : 'max-w-7xl',
        )}
      >
        <Link href="/" className="flex items-center gap-4" event="home_nav_click">
          <Icons.logo className="size-6 sm:size-8" />
          <span className="text-lg font-medium sm:text-2xl">oss.now</span>
        </Link>
        <nav className="gap-1sm:gap-2 flex items-center">
          {env.NODE_ENV === 'production' ? <TempNav /> : <PublicNav />}
          {session?.user.id ? (
            <UserNav />
          ) : env.NODE_ENV !== 'production' ? (
            <Button className="ml-2 rounded-none" asChild>
              <Link href="/login" event="login_nav_click">
                Login
              </Link>
            </Button>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
