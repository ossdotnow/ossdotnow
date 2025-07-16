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
import { Button } from '@workspace/ui/components/button';
import { useTRPC } from '@/hooks/use-trpc';
import { toast } from 'sonner';

interface DeleteCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category: {
    id: string;
    name: string;
    displayName: string;
  } | null;
  type: 'tag' | 'projectType' | 'projectStatus';
}

const categoryTypeLabels = {
  tag: 'tag',
  projectType: 'project type',
  projectStatus: 'project status',
};

export function DeleteCategoryDialog({
  isOpen,
  onClose,
  category,
  type,
}: DeleteCategoryDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Create mutations for each type with their own handlers
  const deleteTagMutation = useMutation(
    trpc.categories.deleteTag.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.categories.getTags.queryOptions());
        toast.success(`${category?.displayName} deleted successfully`);
        onClose();
      },
      onError: (error) => {
        toast.error(`Failed to delete ${categoryTypeLabels[type]}: ${error.message}`);
      },
    }),
  );

  const deleteProjectTypeMutation = useMutation(
    trpc.categories.deleteProjectType.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.categories.getProjectTypes.queryOptions());
        toast.success(`${category?.displayName} deleted successfully`);
        onClose();
      },
      onError: (error) => {
        toast.error(`Failed to delete ${categoryTypeLabels[type]}: ${error.message}`);
      },
    }),
  );

  const deleteProjectStatusMutation = useMutation(
    trpc.categories.deleteProjectStatus.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.categories.getProjectStatuses.queryOptions());
        toast.success(`${category?.displayName} deleted successfully`);
        onClose();
      },
      onError: (error) => {
        toast.error(`Failed to delete ${categoryTypeLabels[type]}: ${error.message}`);
      },
    }),
  );

  const handleDelete = () => {
    if (!category) return;

    switch (type) {
      case 'tag':
        deleteTagMutation.mutate({ id: category.id });
        break;
      case 'projectType':
        deleteProjectTypeMutation.mutate({ id: category.id });
        break;
      case 'projectStatus':
        deleteProjectStatusMutation.mutate({ id: category.id });
        break;
    }
  };

  // Get the current mutation status
  const isLoading =
    deleteTagMutation.isPending ||
    deleteProjectTypeMutation.isPending ||
    deleteProjectStatusMutation.isPending;

  if (!category) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {categoryTypeLabels[type]}</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the {categoryTypeLabels[type]} &quot;
            {category.displayName}&quot; ({category.name})?
            <br />
            <br />
            <span className="font-medium text-red-600">
              This action cannot be undone and may affect existing projects using this{' '}
              {categoryTypeLabels[type]}.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
