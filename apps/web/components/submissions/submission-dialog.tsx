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
import { track as trackDatabuddy } from '@databuddy/sdk';
import SubmissionForm from './submission-form';

export default function SubmissionDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          onClick={() => {
            trackDatabuddy('submit_project_nav_click');
            trackVercel('submit_project_nav_click');
          }}
          className="ml-2 cursor-pointer rounded-none p-2 text-sm"
        >
          Submit Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle>Submit Project</DialogTitle>
          <DialogDescription>Submit an open source project.</DialogDescription>
        </DialogHeader>
        <SubmissionForm />
      </DialogContent>
    </Dialog>
  );
}
