'use client';

import { Button } from '@workspace/ui/components/button';
import Link from '@workspace/ui/components/link';
import { usePathname } from 'next/navigation';
import { cn } from '@workspace/ui/lib/utils';
import { navItems } from '@/lib/nav-items';
import React from 'react';

export default function PublicNav({ className }: { className?: string }) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {navItems.map((item) => (
        <React.Fragment key={item.href}>
          <Button variant="ghost" asChild>
            <Link
              href={item.href}
              event={`${item.label.toLowerCase()}_nav_click`}
              className={cn(
                'text-muted-foreground rounded-none p-2 text-sm hover:bg-neutral-900',
                isActive(item.href) && 'text-primary bg-neutral-900',
              )}
            >
              {item.label}
            </Link>
          </Button>
        </React.Fragment>
      ))}
    </div>
  );
}
