'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import { AlertCircle, CheckCircle, Flag, Loader2 } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { authClient } from '@workspace/auth/client';
import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@/hooks/use-trpc';
import { useState } from 'react';
import { toast } from 'sonner';

export function ProjectReport({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const [open, setOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const trpc = useTRPC();

  const { mutate: reportProject, isPending } = useMutation(
    trpc.launches.reportProject.mutationOptions({
      onSuccess: async () => {
        toast.success(`Project reported successfully!`);
        setOpen(false);
      },
      onError: (err) => {
        console.error('Report error:', err);
        toast.error('Failed to report project.');
      },
    }),
  );

  const handleReport = () => {
    reportProject({ projectId });
  };

  if (!session?.user) {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          window.location.href = '/login';
        }}
      >
        <Flag className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Flag className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-none">
        <DialogHeader>
          <DialogTitle>Report Project</DialogTitle>
          <DialogDescription>
            Report &quot;{projectName}&quot; if it violates our terms of service.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert className="rounded-none">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Report Reason</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>Please only report projects for:</p>
              <ul className="list-inside list-disc space-y-1 text-sm">
                <li>Inappropriate content</li>
                <li>Spam or misleading information</li>
                <li>Security vulnerabilities</li>
              </ul>
              <p className="pt-2 text-xs text-neutral-400">
                Our team will review the project and take appropriate action.
              </p>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-none"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="rounded-none"
            onClick={handleReport}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirm Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
