'use client';

import { Badge } from '@workspace/ui/components/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';

interface RepositoryChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectData: {
    gitRepoUrl: string;
  } | null;
  pendingRepoChange: {
    gitRepoUrl: string;
    gitHost: string;
  } | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RepositoryChangeDialog({
  open,
  onOpenChange,
  projectData,
  pendingRepoChange,
  onConfirm,
  onCancel,
}: RepositoryChangeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Repository Change</DialogTitle>
          <DialogDescription>
            You are about to change the repository URL from{' '}
            <Badge variant="outline" className="font-mono text-sm">
              {projectData?.gitRepoUrl}
            </Badge>{' '}
            to{' '}
            <Badge variant="outline" className="font-mono text-sm">
              {pendingRepoChange?.gitRepoUrl}
            </Badge>
            .
            <br />
            <br />
            Are you sure you want to proceed? This change will be validated before saving.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            Confirm Change
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
