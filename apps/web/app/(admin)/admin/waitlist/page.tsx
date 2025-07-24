'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { WaitlistDataTable } from '@/components/admin/waitlist-data-table';
import { CheckCircle, XCircle, Mail, ArrowUpDown } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { ColumnDef } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/hooks/use-trpc';

type WaitlistEntry = {
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

  const handleApprove = (email: string) => {
    // TODO: Implement approve functionality
    console.log('Approve:', email);
  };

  const handleRemove = (email: string) => {
    // TODO: Implement remove functionality
    console.log('Remove:', email);
  };

  const columns: ColumnDef<WaitlistEntry>[] = [
    {
      accessorKey: 'email',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <div className="flex items-center">
            <Mail className="text-muted-foreground mr-2 h-4 w-4" />
            <span className="font-medium">{row.getValue('email')}</span>
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        return (
          <Badge variant="outline" className="text-orange-600">
            Waiting
          </Badge>
        );
      },
    },
    {
      accessorKey: 'joinedAt',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Submitted
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return new Date(row.getValue('joinedAt')).toLocaleDateString();
      },
      sortingFn: 'datetime',
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        return (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => handleApprove(row.original.email)}>
              <CheckCircle className="mr-1 h-4 w-4 text-green-600" />
              Approve
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleRemove(row.original.email)}>
              <XCircle className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        );
      },
    },
  ];

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error</div>;
  if (!waitlistData) return <div>No waitlist found</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Waitlist</h1>
        <p className="text-muted-foreground">Manage early access waitlist submissions</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Waitlist Management</CardTitle>
            <Badge variant="outline" className="text-blue-600">
              <Mail className="mr-1 h-3 w-3" />
              {waitlistData.length} Total
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <WaitlistDataTable columns={columns} data={waitlistData} />
        </CardContent>
      </Card>
    </div>
  );
}
