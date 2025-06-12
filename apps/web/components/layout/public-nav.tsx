'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@workspace/ui/lib/utils';
import Link from '@/components/link';

export default function PublicNav() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <>
      <Link
        href="/roadmap"
        event="roadmap_nav_click"
        className={cn(
          'text-muted-foreground p-2 hover:bg-neutral-900',
          isActive('/roadmap') && 'text-primary bg-neutral-900',
        )}
      >
        roadmap
      </Link>
      <Link
        href="/projects"
        event="projects_nav_click"
        className={cn(
          'text-muted-foreground p-2 hover:bg-neutral-900',
          isActive('/projects') && 'text-primary bg-neutral-900',
        )}
      >
        projects
      </Link>
      <Link
        href="/about"
        event="about_nav_click"
        className={cn(
          'text-muted-foreground p-2 hover:bg-neutral-900',
          isActive('/about') && 'text-primary bg-neutral-900',
        )}
      >
        about
      </Link>
    </>
  );
}
