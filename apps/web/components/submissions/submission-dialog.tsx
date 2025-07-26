'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import SubmissionForm from './submission-form';
import { track } from '@databuddy/sdk';
import { useState } from 'react';
import { toast } from 'sonner';

export default function SubmissionDialog() {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    toast.success("Project submitted successfully! We'll review it and get back to you soon.");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={() => {
            track('submit_project_nav_click');
          }}
          size="sm"
          className="ml-2 cursor-pointer rounded-none px-2 text-xs md:text-sm"
        >
          Submit Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle>Submit Project</DialogTitle>
          <DialogDescription>Submit an open source project.</DialogDescription>
        </DialogHeader>
        <SubmissionForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
