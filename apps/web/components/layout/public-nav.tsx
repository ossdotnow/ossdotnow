'use client';

import Link from '@workspace/ui/components/link';
import { usePathname } from 'next/navigation';
import { cn } from '@workspace/ui/lib/utils';
import SubmissionDialog from '../submissions/submission-dialog';
import React from 'react';

export default function PublicNav({ className }: { className?: string }) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  const navItems = [
    { href: '/projects', label: 'Projects' },
    { href: '/launches', label: 'Launches' },
    { href: '/roadmap', label: 'Roadmap' },
    { href: '/about', label: 'About' },
  ];

  return (
    <>
      {navItems.map((item, idx) => (
        <React.Fragment key={item.href}>
          <Link
            href={item.href}
            event={`${item.label.toLowerCase()}_nav_click`}
            className={cn(
              'text-muted-foreground p-2 hover:bg-neutral-900',
              isActive(item.href) && 'text-primary bg-neutral-900',
            )}
          >
            {item.label}
          </Link>
          {idx === 1 && <SubmissionDialog />}
        </React.Fragment>
      ))}
    </>
  );
}
