'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/hooks/use-trpc';

type User = {
  id: string;
  email: string;
  joinedAt: Date;
};

export default function AdminWaitlistDashboard() {
  const trpc = useTRPC();

  const {
    data: waitlistData,
    isLoading,
    isError,
  } = useQuery(trpc.earlyAccess.getWaitlist.queryOptions());

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error</div>;
  if (!waitlistData) return <div>No waitlist found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Waitlist</h1>
          <p className="text-muted-foreground">Manage waitlist</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Total</span>
            <span className="text-sm font-medium">{waitlistData.length}</span>
          </div>
        </div>
      </div>

      <UsersTable users={waitlistData} />
    </div>
  );
}

function UsersTable({ users }: { users: User[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Joined At</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.email}</TableCell>
            <TableCell>{user.joinedAt.toLocaleDateString()}</TableCell>
            <TableCell className="space-x-2 text-right">{/* TODO: Add actions */}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
