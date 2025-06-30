'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Switch } from '@workspace/ui/components/switch';
import { Button } from '@workspace/ui/components/button';
import { Label } from '@workspace/ui/components/label';
import { Input } from '@workspace/ui/components/input';
import { useState, useEffect } from 'react';
import { useTRPC } from '@/hooks/use-trpc';
import { toast } from 'sonner';

interface EditCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category: {
    id: string;
    name: string;
    displayName: string;
    isActive: boolean;
    sortOrder: number;
  } | null;
  type: 'tag' | 'projectType' | 'projectStatus';
}

const categoryTypeLabels = {
  tag: 'tag',
  projectType: 'project type',
  projectStatus: 'project status',
};

export function EditCategoryDialog({ isOpen, onClose, category, type }: EditCategoryDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Form state
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  // Reset form when category changes
  useEffect(() => {
    if (category) {
      setName(category.name);
      setDisplayName(category.displayName);
      setIsActive(category.isActive);
      setSortOrder(category.sortOrder);
    }
  }, [category]);

  // Create mutations for each type
  const updateTagMutation = useMutation(
    trpc.categories.updateTag.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.categories.getTags.queryOptions());
        toast.success(`Tag "${displayName}" updated successfully`);
        onClose();
      },
      onError: (error) => {
        toast.error(`Failed to update tag: ${error.message}`);
      },
    }),
  );

  const updateProjectTypeMutation = useMutation(
    trpc.categories.updateProjectType.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.categories.getProjectTypes.queryOptions());
        toast.success(`Project type "${displayName}" updated successfully`);
        onClose();
      },
      onError: (error) => {
        toast.error(`Failed to update project type: ${error.message}`);
      },
    }),
  );

  const updateProjectStatusMutation = useMutation(
    trpc.categories.updateProjectStatus.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.categories.getProjectStatuses.queryOptions());
        toast.success(`Project status "${displayName}" updated successfully`);
        onClose();
      },
      onError: (error) => {
        toast.error(`Failed to update project status: ${error.message}`);
      },
    }),
  );

  // Auto-generate name from display name (kebab-case)
  const handleDisplayNameChange = (value: string) => {
    setDisplayName(value);

    // Always auto-generate kebab-case name from display name
    const kebabName = value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/[^a-z0-9-]/g, '') // Remove special characters except dashes
      .replace(/-+/g, '-') // Replace multiple dashes with single dash
      .replace(/^-|-$/g, ''); // Remove leading/trailing dashes

    setName(kebabName);
  };

  const handleSubmit = () => {
    if (!category) return;

    // Basic validation
    if (!name.trim() || !displayName.trim()) {
      toast.error('Name and display name are required');
      return;
    }

    const updateData = {
      id: category.id,
      name: name.trim(),
      displayName: displayName.trim(),
      isActive,
      sortOrder,
    };

    switch (type) {
      case 'tag':
        updateTagMutation.mutate(updateData);
        break;
      case 'projectType':
        updateProjectTypeMutation.mutate(updateData);
        break;
      case 'projectStatus':
        updateProjectStatusMutation.mutate(updateData);
        break;
    }
  };

  // Get the current mutation status
  const isLoading =
    updateTagMutation.isPending ||
    updateProjectTypeMutation.isPending ||
    updateProjectStatusMutation.isPending;

  if (!category) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {categoryTypeLabels[type]}</DialogTitle>
          <DialogDescription>
            Update the details for &quot;{category.displayName}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name (ID)</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="kebab-case-name"
              disabled={isLoading}
              className="bg-muted"
            />
            <p className="text-muted-foreground text-sm">
              Auto-generated from display name (spaces become dashes)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => handleDisplayNameChange(e.target.value)}
              placeholder="Display Name"
              disabled={isLoading}
            />
            <p className="text-muted-foreground text-sm">
              User-friendly name shown in the interface
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sortOrder">Sort Order</Label>
            <Input
              id="sortOrder"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
              placeholder="0"
              disabled={isLoading}
            />
            <p className="text-muted-foreground text-sm">Lower numbers appear first in lists</p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isLoading}
            />
            <Label htmlFor="isActive">Active</Label>
            <p className="text-muted-foreground text-sm">
              Whether this {categoryTypeLabels[type]} is available for use
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
