'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { LayoutDashboard, LogOut } from 'lucide-react';
import { authClient } from '@workspace/auth/client';
import Link from '@workspace/ui/components/link';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/hooks/use-trpc';
import { redirect } from 'next/navigation';

export default function NavUser() {
  const trpc = useTRPC();
  const signOut = async () => {
    await authClient.signOut();
    redirect('/login');
  };

  const { data: user, isLoading } = useQuery(trpc.user.me.queryOptions());

  return isLoading ? (
    <Skeleton className="ml-2 size-9 rounded-none" />
  ) : (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="ml-2 size-8 cursor-pointer rounded-none">
          <AvatarImage src={user?.image || ''} alt={user?.name} />
          <AvatarFallback className="bg-neutral-900 text-xs text-neutral-400">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-56 rounded-none border-neutral-800 bg-neutral-900"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <Link href="/profile/me" className="rounded-none">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm hover:bg-neutral-800">
              <Avatar className="h-8 w-8 rounded-none">
                <AvatarImage src={user?.image || ''} alt={user?.name} />
                <AvatarFallback className="bg-neutral-800 text-neutral-400">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium text-white">{user?.name}</span>
                <span className="truncate text-xs text-neutral-400">{user?.email}</span>
              </div>
            </div>
          </Link>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-neutral-800" />
        {user?.role !== 'user' && (
          <>
            <DropdownMenuItem
              asChild
              className="rounded-none text-neutral-300 hover:bg-neutral-800 hover:text-white"
            >
              <Link href="/admin">
                <LayoutDashboard />
                Admin Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-neutral-800" />
          </>
        )}
        <DropdownMenuItem
          onClick={signOut}
          className="rounded-none text-neutral-300 hover:bg-neutral-800 hover:text-white"
        >
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
