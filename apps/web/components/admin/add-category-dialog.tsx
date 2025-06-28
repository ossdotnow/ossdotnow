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

interface AddCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'tag' | 'projectType' | 'projectStatus';
}

const categoryTypeLabels = {
  tag: 'tag',
  projectType: 'project type',
  projectStatus: 'project status',
};

const categoryTypePlaceholders = {
  tag: {
    name: 'web-development',
    displayName: 'Web Development',
  },
  projectType: {
    name: 'fintech',
    displayName: 'FinTech',
  },
  projectStatus: {
    name: 'early-stage',
    displayName: 'Early Stage',
  },
};

export function AddCategoryDialog({ isOpen, onClose, type }: AddCategoryDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Form state
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setDisplayName('');
      setIsActive(true);
      setSortOrder(0);
    }
  }, [isOpen]);

  // Create mutations for each type
  const createTagMutation = useMutation(
    trpc.categories.createTag.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.categories.getTags.queryOptions());
        toast.success(`Tag "${displayName}" created successfully`);
        onClose();
      },
      onError: (error) => {
        toast.error(`Failed to create tag: ${error.message}`);
      },
    }),
  );

  const createProjectTypeMutation = useMutation(
    trpc.categories.createProjectType.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.categories.getProjectTypes.queryOptions());
        toast.success(`Project type "${displayName}" created successfully`);
        onClose();
      },
      onError: (error) => {
        toast.error(`Failed to create project type: ${error.message}`);
      },
    }),
  );

  const createProjectStatusMutation = useMutation(
    trpc.categories.createProjectStatus.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.categories.getProjectStatuses.queryOptions());
        toast.success(`Project status "${displayName}" created successfully`);
        onClose();
      },
      onError: (error) => {
        toast.error(`Failed to create project status: ${error.message}`);
      },
    }),
  );

  const handleSubmit = () => {
    // Basic validation
    if (!name.trim() || !displayName.trim()) {
      toast.error('Name and display name are required');
      return;
    }

    const createData = {
      name: name.trim(),
      displayName: displayName.trim(),
      isActive,
      sortOrder,
    };

    switch (type) {
      case 'tag':
        createTagMutation.mutate(createData);
        break;
      case 'projectType':
        createProjectTypeMutation.mutate(createData);
        break;
      case 'projectStatus':
        createProjectStatusMutation.mutate(createData);
        break;
    }
  };

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

  // Get the current mutation status
  const isLoading =
    createTagMutation.isPending ||
    createProjectTypeMutation.isPending ||
    createProjectStatusMutation.isPending;

  const placeholders = type ? categoryTypePlaceholders[type] : { name: '', displayName: '' };
  const typeLabel = type ? categoryTypeLabels[type] : 'category';

  if (!type) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New {typeLabel}</DialogTitle>
          <DialogDescription>Create a new {typeLabel} for project categorization</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => handleDisplayNameChange(e.target.value)}
              placeholder={placeholders.displayName}
              disabled={isLoading}
            />
            <p className="text-muted-foreground text-sm">
              User-friendly name shown in the interface
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name (ID)</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={placeholders.name}
              disabled={isLoading}
              className="bg-muted"
            />
            <p className="text-muted-foreground text-sm">
              Auto-generated from display name (spaces become dashes)
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
              Whether this {typeLabel} is available for use
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Creating...' : `Create ${typeLabel}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
