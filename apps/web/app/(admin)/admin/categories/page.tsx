'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Edit, FolderPlus, Trash2, Search, Tag, Folder, Activity } from 'lucide-react';
import { DeleteCategoryDialog } from '@/components/admin/delete-category-dialog';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { EditCategoryDialog } from '@/components/admin/edit-category-dialog';
import { AddCategoryDialog } from '@/components/admin/add-category-dialog';
import { Switch } from '@workspace/ui/components/switch';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Badge } from '@workspace/ui/components/badge';
import { useTRPC } from '@/hooks/use-trpc';
import { useState } from 'react';

export default function AdminCategoriesDashboard() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [searchTypes, setSearchTypes] = useState('');
  const [searchTags, setSearchTags] = useState('');
  const [searchStatuses, setSearchStatuses] = useState('');

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

  // Filter data based on search
  const filteredTypes = (projectTypesData || []).filter((type) =>
    type.name.toLowerCase().includes(searchTypes.toLowerCase()),
  );

  const filteredTags = (tagsData || []).filter((tag) =>
    tag.name.toLowerCase().includes(searchTags.toLowerCase()),
  );

  const filteredStatuses = (projectStatusesData || []).filter((status) =>
    status.name.toLowerCase().includes(searchStatuses.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <p className="text-muted-foreground">Manage project categories, types, and statuses</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Project Types Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Project Types</CardTitle>
                <CardDescription>Manage project type categories</CardDescription>
              </div>
              <Badge variant="outline" className="text-blue-600">
                <Folder className="mr-1 h-3 w-3" />
                {typesLoading ? '...' : filteredTypes.length} Types
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center space-x-2">
              <Search className="text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search types..."
                value={searchTypes}
                onChange={(e) => setSearchTypes(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="space-y-4">
              {typesLoading ? (
                <div className="py-4 text-center">
                  <span className="text-muted-foreground">Loading types...</span>
                </div>
              ) : typesError ? (
                <div className="py-4 text-center">
                  <span className="text-red-600">Error loading types</span>
                </div>
              ) : (
                <>
                  {filteredTypes.map((type) => (
                    <div key={type.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{type.displayName}</span>
                        <span className="text-muted-foreground text-sm">({type.name})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={type.isActive}
                          onCheckedChange={() => handleToggleStatus(type, 'projectType')}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(type, 'projectType')}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(type, 'projectType')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => openAddDialog('projectType')}
                  >
                    <FolderPlus className="mr-2 h-4 w-4" />
                    Add Project Type
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tags Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tags</CardTitle>
                <CardDescription>Manage available project tags</CardDescription>
              </div>
              <Badge variant="outline" className="text-green-600">
                <Tag className="mr-1 h-3 w-3" />
                {tagsLoading ? '...' : filteredTags.length} Tags
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center space-x-2">
              <Search className="text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search tags..."
                value={searchTags}
                onChange={(e) => setSearchTags(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="space-y-4">
              {tagsLoading ? (
                <div className="py-4 text-center">
                  <span className="text-muted-foreground">Loading tags...</span>
                </div>
              ) : tagsError ? (
                <div className="py-4 text-center">
                  <span className="text-red-600">Error loading tags</span>
                </div>
              ) : (
                <>
                  {filteredTags.map((tag) => (
                    <div key={tag.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge>{tag.displayName}</Badge>
                        <span className="text-muted-foreground text-sm">({tag.name})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={tag.isActive}
                          onCheckedChange={() => handleToggleStatus(tag, 'tag')}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(tag, 'tag')}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(tag, 'tag')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={() => openAddDialog('tag')}>
                    <Tag className="mr-2 h-4 w-4" />
                    Add New Tag
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Project Statuses Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Project Statuses</CardTitle>
                <CardDescription>Manage project status options</CardDescription>
              </div>
              <Badge variant="outline" className="text-purple-600">
                <Activity className="mr-1 h-3 w-3" />
                {statusesLoading ? '...' : filteredStatuses.length} Statuses
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center space-x-2">
              <Search className="text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search statuses..."
                value={searchStatuses}
                onChange={(e) => setSearchStatuses(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="space-y-4">
              {statusesLoading ? (
                <div className="py-4 text-center">
                  <span className="text-muted-foreground">Loading statuses...</span>
                </div>
              ) : statusesError ? (
                <div className="py-4 text-center">
                  <span className="text-red-600">Error loading statuses</span>
                </div>
              ) : (
                <>
                  {filteredStatuses.map((status) => (
                    <div key={status.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{status.displayName}</Badge>
                        <span className="text-muted-foreground text-sm">({status.name})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={status.isActive}
                          onCheckedChange={() => handleToggleStatus(status, 'projectStatus')}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(status, 'projectStatus')}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(status, 'projectStatus')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => openAddDialog('projectStatus')}
                  >
                    <Activity className="mr-2 h-4 w-4" />
                    Add New Status
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
