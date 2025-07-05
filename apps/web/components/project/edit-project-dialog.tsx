'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog';
import { track as trackVercel } from '@vercel/analytics/react';
import { Button } from '@workspace/ui/components/button';
import { Pencil } from "lucide-react"
import { track as trackDatabuddy } from '@databuddy/sdk';
import EditProjectForm from './edit-project-form';

interface EditProjectDialogProps {
  projectId: string;
  initialData?: any;
}

export default function EditProjectDialog({ projectId, initialData }: EditProjectDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            trackDatabuddy('edit_project_nav_click');
            trackVercel('edit_project_nav_click');
          }}
          className="gap-2 rounded-none"
          size="sm"
        >
          <Pencil className="h-4 w-4" />
          Edit Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>Edit your project details.</DialogDescription>
        </DialogHeader>
        <EditProjectForm projectId={projectId} initialData={initialData} />
      </DialogContent>
    </Dialog>
  );
}
