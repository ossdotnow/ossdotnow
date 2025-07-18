'use client';

import { Edit, FolderPlus, Trash2, Tag, Folder, Activity, ArrowUpDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { DeleteCategoryDialog } from '@/components/admin/delete-category-dialog';
import { CategoriesDataTable } from '@/components/admin/categories-data-table';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { EditCategoryDialog } from '@/components/admin/edit-category-dialog';
import { AddCategoryDialog } from '@/components/admin/add-category-dialog';
import { Switch } from '@workspace/ui/components/switch';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { ColumnDef } from '@tanstack/react-table';
import { useTRPC } from '@/hooks/use-trpc';
import { useState } from 'react';

type CategoryItem = {
  id: string;
  name: string;
  displayName: string;
  isActive: boolean;
  sortOrder: number;
};

export default function AdminCategoriesDashboard() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{
    id: string;
    name: string;
    displayName: string;
  } | null>(null);
  const [categoryTypeToDelete, setCategoryTypeToDelete] = useState<
    'tag' | 'projectType' | 'projectStatus' | null
  >(null);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<{
    id: string;
    name: string;
    displayName: string;
    isActive: boolean;
    sortOrder: number;
  } | null>(null);
  const [categoryTypeToEdit, setCategoryTypeToEdit] = useState<
    'tag' | 'projectType' | 'projectStatus' | null
  >(null);

  // Add dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [categoryTypeToAdd, setCategoryTypeToAdd] = useState<
    'tag' | 'projectType' | 'projectStatus' | null
  >(null);

  const openDeleteDialog = (
    category: { id: string; name: string; displayName: string },
    type: 'tag' | 'projectType' | 'projectStatus',
  ) => {
    setCategoryToDelete(category);
    setCategoryTypeToDelete(type);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
    setCategoryTypeToDelete(null);
  };

  const openEditDialog = (
    category: {
      id: string;
      name: string;
      displayName: string;
      isActive: boolean;
      sortOrder: number;
    },
    type: 'tag' | 'projectType' | 'projectStatus',
  ) => {
    setCategoryToEdit(category);
    setCategoryTypeToEdit(type);
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setCategoryToEdit(null);
    setCategoryTypeToEdit(null);
  };

  const openAddDialog = (type: 'tag' | 'projectType' | 'projectStatus') => {
    setCategoryTypeToAdd(type);
    setAddDialogOpen(true);
  };

  const closeAddDialog = () => {
    setAddDialogOpen(false);
    setCategoryTypeToAdd(null);
  };

  // Toggle mutations
  const toggleTagStatusMutation = useMutation(
    trpc.categories.toggleTagStatus.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.categories.getTags.queryOptions());
      },
    }),
  );

  const toggleProjectTypeStatusMutation = useMutation(
    trpc.categories.toggleProjectTypeStatus.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.categories.getProjectTypes.queryOptions());
      },
    }),
  );

  const toggleProjectStatusStatusMutation = useMutation(
    trpc.categories.toggleProjectStatusStatus.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.categories.getProjectStatuses.queryOptions());
      },
    }),
  );

  const handleToggleStatus = (
    category: { id: string; isActive: boolean },
    type: 'tag' | 'projectType' | 'projectStatus',
  ) => {
    const newStatus = !category.isActive;

    switch (type) {
      case 'tag':
        toggleTagStatusMutation.mutate({ id: category.id, isActive: newStatus });
        break;
      case 'projectType':
        toggleProjectTypeStatusMutation.mutate({ id: category.id, isActive: newStatus });
        break;
      case 'projectStatus':
        toggleProjectStatusStatusMutation.mutate({ id: category.id, isActive: newStatus });
        break;
    }
  };

  // Fetch real data from API
  const {
    data: tagsData,
    isLoading: tagsLoading,
    isError: tagsError,
  } = useQuery(trpc.categories.getTags.queryOptions());

  const {
    data: projectTypesData,
    isLoading: typesLoading,
    isError: typesError,
  } = useQuery(trpc.categories.getProjectTypes.queryOptions());

  const {
    data: projectStatusesData,
    isLoading: statusesLoading,
    isError: statusesError,
  } = useQuery(trpc.categories.getProjectStatuses.queryOptions());

  const createColumns = (
    type: 'tag' | 'projectType' | 'projectStatus',
  ): ColumnDef<CategoryItem>[] => [
    {
      accessorKey: 'displayName',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Display Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const icon =
          type === 'tag' ? (
            <Tag className="mr-2 h-4 w-4" />
          ) : type === 'projectType' ? (
            <Folder className="mr-2 h-4 w-4" />
          ) : (
            <Activity className="mr-2 h-4 w-4" />
          );
        return (
          <div className="flex items-center">
            {icon}
            <span className="font-medium">{row.getValue('displayName')}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Internal Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return <span className="text-muted-foreground text-sm">{row.getValue('name')}</span>;
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        return (
          <Badge variant={row.getValue('isActive') ? 'default' : 'secondary'}>
            {row.getValue('isActive') ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'sortOrder',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Sort Order
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-end space-x-2">
            <Switch
              checked={row.original.isActive}
              onCheckedChange={() => handleToggleStatus(row.original, type)}
            />
            <Button variant="ghost" size="sm" onClick={() => openEditDialog(row.original, type)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(row.original, type)}>
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <p className="text-muted-foreground">Manage project categories, types, and statuses</p>
      </div>

      <Tabs defaultValue="types" className="space-y-4">
        <TabsList className="bg-muted/30 grid w-full grid-cols-3">
          <TabsTrigger value="types">
            <Folder className="mr-2 h-4 w-4" />
            Project Types
          </TabsTrigger>
          <TabsTrigger value="tags">
            <Tag className="mr-2 h-4 w-4" />
            Tags
          </TabsTrigger>
          <TabsTrigger value="statuses">
            <Activity className="mr-2 h-4 w-4" />
            Project Statuses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Project Types</CardTitle>
                <Button onClick={() => openAddDialog('projectType')}>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Add Project Type
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {typesLoading ? (
                <div className="py-4 text-center">
                  <span className="text-muted-foreground">Loading types...</span>
                </div>
              ) : typesError ? (
                <div className="py-4 text-center">
                  <span className="text-red-600">Error loading types</span>
                </div>
              ) : (
                <CategoriesDataTable
                  columns={createColumns('projectType')}
                  data={projectTypesData || []}
                  searchPlaceholder="Search project types..."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tags</CardTitle>
                <Button onClick={() => openAddDialog('tag')}>
                  <Tag className="mr-2 h-4 w-4" />
                  Add Tag
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tagsLoading ? (
                <div className="py-4 text-center">
                  <span className="text-muted-foreground">Loading tags...</span>
                </div>
              ) : tagsError ? (
                <div className="py-4 text-center">
                  <span className="text-red-600">Error loading tags</span>
                </div>
              ) : (
                <CategoriesDataTable
                  columns={createColumns('tag')}
                  data={tagsData || []}
                  searchPlaceholder="Search tags..."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statuses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Project Statuses</CardTitle>
                <Button onClick={() => openAddDialog('projectStatus')}>
                  <Activity className="mr-2 h-4 w-4" />
                  Add Status
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {statusesLoading ? (
                <div className="py-4 text-center">
                  <span className="text-muted-foreground">Loading statuses...</span>
                </div>
              ) : statusesError ? (
                <div className="py-4 text-center">
                  <span className="text-red-600">Error loading statuses</span>
                </div>
              ) : (
                <CategoriesDataTable
                  columns={createColumns('projectStatus')}
                  data={projectStatusesData || []}
                  searchPlaceholder="Search statuses..."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Dialog */}
      <AddCategoryDialog
        isOpen={addDialogOpen}
        onClose={closeAddDialog}
        type={categoryTypeToAdd!}
      />

      {/* Edit Dialog */}
      <EditCategoryDialog
        isOpen={editDialogOpen}
        onClose={closeEditDialog}
        category={categoryToEdit}
        type={categoryTypeToEdit!}
      />

      {/* Delete Dialog */}
      <DeleteCategoryDialog
        isOpen={deleteDialogOpen}
        onClose={closeDeleteDialog}
        category={categoryToDelete}
        type={categoryTypeToDelete!}
      />
    </div>
  );
}
