'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Search, CheckCircle, XCircle, Mail } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Badge } from '@workspace/ui/components/badge';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/hooks/use-trpc';
import { useState } from 'react';

type User = {
  id: string;
  email: string;
  joinedAt: Date;
};

export default function AdminWaitlistDashboard() {
  const trpc = useTRPC();
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: waitlistData,
    isLoading,
    isError,
  } = useQuery(trpc.earlyAccess.getWaitlist.queryOptions());

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error</div>;
  if (!waitlistData) return <div>No waitlist found</div>;

  // Filter waitlist based on search query
  const filteredWaitlist = waitlistData.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return user.email.toLowerCase().includes(searchLower);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Waitlist</h1>
        <p className="text-muted-foreground">Manage early access waitlist submissions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Waitlist Management</CardTitle>
          <CardDescription>
            {searchQuery
              ? `Showing ${filteredWaitlist.length} of ${waitlistData.length} waitlist entries`
              : `Total ${waitlistData.length} entries in waitlist`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-blue-600">
                <Mail className="mr-1 h-3 w-3" />
                {waitlistData.length} Total
              </Badge>
            </div>
          </div>

          <WaitlistTable users={filteredWaitlist} />
        </CardContent>
      </Card>
    </div>
  );
}

function WaitlistTable({ users }: { users: User[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.email}</TableCell>
            <TableCell>
              <Badge variant="outline" className="text-orange-600">
                Waiting
              </Badge>
            </TableCell>
            <TableCell>{new Date(user.joinedAt).toLocaleDateString()}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // TODO: Implement approve functionality
                    console.log('Approve:', user.email);
                  }}
                >
                  <CheckCircle className="mr-1 h-4 w-4 text-green-600" />
                  Approve
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // TODO: Implement remove functionality
                    console.log('Remove:', user.email);
                  }}
                >
                  <XCircle className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
