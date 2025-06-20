'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { user, userRoleEnum } from '@workspace/db/schema';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/hooks/use-trpc';
import { useQueryState } from 'nuqs';

type User = typeof user.$inferSelect;

export default function AdminUsersDashboard() {
  const trpc = useTRPC();
  const [role, setRole] = useQueryState('role', {
    defaultValue: 'all',
  });

  const tabs = [...userRoleEnum.enumValues, 'all'] as const;

  const { data: users, isLoading, isError } = useQuery(trpc.users.getUsers.queryOptions());

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error</div>;
  if (!users) return <div>No users found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage users</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Total</span>
            <span className="text-sm font-medium">{users.length}</span>
          </div>
        </div>
      </div>

      <Tabs className="space-y-4" defaultValue={role}>
        <TabsList className="bg-muted/30">
          {tabs.map((tab) => (
            <TabsTrigger key={tab} value={tab} className="w-28" onClick={() => setRole(tab)}>
              <span className="capitalize">{tab}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            <UsersTable
              users={users.filter((user) => user.role === (tab as User['role']) || tab === 'all')}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function UsersTable({ users }: { users: User[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Name</TableHead>
          <TableHead>Repository</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <Badge
                variant={
                  user.role === 'admin'
                    ? 'default'
                    : user.role === 'user'
                      ? 'destructive'
                      : 'outline'
                }
              >
                {user.role}
              </Badge>
            </TableCell>
            <TableCell className="space-x-2 text-right">
              <Button variant="destructive">Ban User</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
