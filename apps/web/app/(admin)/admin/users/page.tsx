'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UsersDataTable } from '@/components/admin/users-data-table';
import { Button } from '@workspace/ui/components/button';
import { ArrowUpDown, Edit, Trash2 } from 'lucide-react';
import { Label } from '@workspace/ui/components/label';
import { Input } from '@workspace/ui/components/input';
import { Badge } from '@workspace/ui/components/badge';
import { userRoleEnum } from '@workspace/db/schema';
import { ColumnDef } from '@tanstack/react-table';
import { useTRPC } from '@/hooks/use-trpc';
import { useState } from 'react';
import { toast } from 'sonner';

type User = {
  id: string;
  name: string;
  email?: string;
  role: string | null;
  createdAt: Date;
};

export default function AdminUsersDashboard() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    role: '' as (typeof userRoleEnum.enumValues)[number],
  });

  const {
    data: users,
    isLoading,
    isError,
  } = useQuery(
    trpc.users.getUsers.queryOptions({
      limit: 100,
      offset: 0,
    }),
  );

  const { data: me } = useQuery(trpc.user.me.queryOptions());

  const updateUserMutation = useMutation(
    trpc.users.updateUser.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['users.getUsers'] });
        setEditDialogOpen(false);
        toast.success('User role updated successfully');
      },
      onError: () => {
        toast.error('Failed to update user role');
      },
    }),
  );

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      role: user.role as (typeof userRoleEnum.enumValues)[number],
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    updateUserMutation.mutate({
      userId: editingUser.id,
      role: editFormData.role,
    });
  };

  const isAdmin = me?.role === 'admin';

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return <span className="font-medium">{row.getValue('name')}</span>;
      },
    },
    ...(isAdmin
      ? [
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
          } as ColumnDef<User>,
        ]
      : []),
    ...(isAdmin
      ? [
          {
            accessorKey: 'role',
            header: 'Role',
            filterFn: (row, columnId, filterValue) => {
              if (filterValue === 'all') return true;
              return row.original.role === filterValue;
            },
            cell: ({ row }) => {
              return <Badge variant="outline">{row.getValue('role')}</Badge>;
            },
          } as ColumnDef<User>,
        ]
      : []),
    {
      id: 'status',
      header: 'Status',
      cell: () => {
        return (
          <Badge variant="outline" className="text-green-600">
            Active
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Joined
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return new Date(row.getValue('createdAt')).toLocaleDateString();
      },
    },
    ...(isAdmin
      ? [
          {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
              return (
                <div className="flex items-center justify-end space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEditClick(row.original)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              );
            },
          } as ColumnDef<User>,
        ]
      : []),
  ];

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error</div>;
  if (!users) return <div>No users found</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">Manage user accounts, roles, and permissions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <UsersDataTable columns={columns} data={users} />
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Change the user&apos;s role. Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={editingUser?.name || ''}
                  className="col-span-3"
                  disabled
                  readOnly
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={editingUser?.email || ''}
                  className="col-span-3"
                  disabled
                  readOnly
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select
                  value={editFormData.role}
                  onValueChange={(value) =>
                    setEditFormData({
                      ...editFormData,
                      role: value as (typeof userRoleEnum.enumValues)[number],
                    })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
