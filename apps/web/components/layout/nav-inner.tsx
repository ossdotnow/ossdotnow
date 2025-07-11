'use client';

import Icons from '@workspace/ui/components/icons';
import Link from '@workspace/ui/components/link';
import { cn } from '@workspace/ui/lib/utils';
import { env } from '@workspace/env/client';
import { navItems } from '@/lib/nav-items';
import { MobileNav } from './mobile-nav';
import PublicNav from './public-nav';
import { TempNav } from './temp-nav';

import { useState } from 'react';

// TODO: fix this
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function NavInner({ session }: { session: any }) {
  const [open, setOpen] = useState(false);

  return (
    <header
      className={cn(
        'sticky top-8 z-50 mx-6 max-w-[1080px] border border-[#404040] bg-black transition-all duration-100 md:mx-auto',
        {
          'top-0 mx-0 border-none': open,
        },
      )}
    >
      <div
        className={cn(
          'mx-auto flex h-16 items-center justify-between px-4 transition-all duration-100',
          {
            'px-6': open,
          },
        )}
      >
        <div className="flex items-center gap-2">
          <MobileNav items={navItems} className="md:hidden" open={open} setOpen={setOpen} />
          <Link href="/" className="flex items-center gap-2" event="home_nav_click">
            <Icons.logo className="size-6 sm:size-7" />
            <span className="text-lg font-medium text-white sm:text-xl">oss.now</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-2 md:flex">
            {env.NEXT_PUBLIC_VERCEL_ENV === 'production' ? (
              <TempNav />
            ) : (
              <PublicNav session={session} />
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
