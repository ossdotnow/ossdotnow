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
import { authClient } from '@workspace/auth/client';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/hooks/use-trpc';
import { redirect } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function NavUser() {
  const trpc = useTRPC();
  const signOut = async () => {
    await authClient.signOut();
    redirect('/login');
  };

  const { data: user, isLoading } = useQuery(trpc.user.me.queryOptions());

  return isLoading ? (
    <Skeleton className="h-8 w-8 rounded-none" />
  ) : (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-8 w-8 rounded-none">
          <AvatarImage src={user?.image || ''} alt={user?.name} />
          <AvatarFallback className="rounded-none">CN</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-56 rounded-none"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-none">
              <AvatarImage src={user?.image || ''} alt={user?.name} />
              <AvatarFallback className="rounded-none">CN</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user?.name}</span>
              <span className="truncate text-xs">{user?.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
