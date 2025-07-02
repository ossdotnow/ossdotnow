"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog';
import SubmissionForm from './submission-form';
import { useState } from 'react';

export default function SubmissionDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="text-muted-foreground p-2 hover:bg-neutral-900 cursor-pointer"
          type="button"
        >
          Submit Project
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle>Submit A Project</DialogTitle>
          <DialogDescription>Submit an open source project for review and listing.</DialogDescription>
        </DialogHeader>
        <SubmissionForm />
      </DialogContent>
    </Dialog>
  );
}
