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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@workspace/ui/components/form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Textarea } from '@workspace/ui/components/textarea';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { Rocket, Loader2, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { useTRPC } from '@/hooks/use-trpc';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod/v4';

const launchSchema = z.object({
  tagline: z
    .string()
    .min(10, 'Tagline must be at least 10 characters')
    .max(100, 'Tagline must be less than 100 characters'),
  detailedDescription: z.string().optional(),
});

type LaunchFormData = z.infer<typeof launchSchema>;

interface LaunchProjectDialogProps {
  projectId: string;
  projectName: string;
  isRepoPrivate?: boolean;
  gitRepoUrl?: string;
  gitHost?: string;
}

export function LaunchProjectDialog({
  projectId,
  projectName,
  isRepoPrivate,
  gitRepoUrl,
  gitHost
}: LaunchProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [privateRepoDialogOpen, setPrivateRepoDialogOpen] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<LaunchFormData>({
    resolver: zodResolver(launchSchema),
    defaultValues: {
      tagline: '',
      detailedDescription: '',
    },
  });

  const refreshRepoStatusMutation = useMutation(
    trpc.projects.refreshRepoStatus.mutationOptions({
      onSuccess: (data) => {
                // Always invalidate queries to ensure fresh data
        queryClient.invalidateQueries({
          queryKey: trpc.projects.getProject.queryKey({ id: projectId }),
        });

        // Also invalidate repository data cache
        queryClient.invalidateQueries({
          predicate: (query) => query.queryKey[0] === 'repository',
        });

        if (data.statusChanged && !data.isNowPrivate) {
          toast.success('Repository is now public! You can launch your project.');
          setPrivateRepoDialogOpen(false);
          // Force a page refresh to ensure UI updates with new data
          setTimeout(() => window.location.reload(), 1000);
        } else if (data.statusChanged && data.isNowPrivate) {
          toast.info('Repository is now private.');
        } else if (!data.statusChanged && data.isNowPrivate) {
          toast.info('Repository is still private. Please make it public to launch.');
        } else if (!data.statusChanged && !data.isNowPrivate) {
          toast.success('Repository is already public! You can launch your project.');
          setPrivateRepoDialogOpen(false);
        }
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to refresh repository status');
      },
    }),
  );

  const launchMutation = useMutation(
    trpc.launches.launchProject.mutationOptions({
      onSuccess: () => {
        toast.success('Project launched successfully!');
        setOpen(false);
        form.reset();
        queryClient.invalidateQueries({
          queryKey: trpc.launches.getTodayLaunches.queryKey({ limit: 50 }),
        });
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to launch project');
      },
    }),
  );

  const onSubmit = (data: LaunchFormData) => {
    launchMutation.mutate({
      projectId,
      ...data,
    });
  };

      const getRepoSettingsUrl = () => {
    if (!gitRepoUrl || !gitHost) return '';

    try {
      // Handle different URL formats
      let repoPath = '';

      if (gitRepoUrl.includes('github.com') || gitRepoUrl.includes('gitlab.com')) {
        const url = new URL(gitRepoUrl);
        repoPath = url.pathname;
      } else {
        // Handle formats like "owner/repo" or "owner/repo.git"
        repoPath = `/${gitRepoUrl}`;
      }

      const pathParts = repoPath.split('/').filter(Boolean);

      if (pathParts.length >= 2) {
        const owner = pathParts[0];
        const repo = pathParts[1]?.replace(/\.git$/, '') || '';

        if (gitHost === 'github') {
          return `https://github.com/${owner}/${repo}/settings`;
        } else if (gitHost === 'gitlab') {
          return `https://gitlab.com/${owner}/${repo}/-/settings/general`;
        }
      }
    } catch (e) {
      console.error('Failed to parse repository URL:', e);

      // Fallback: try to extract owner/repo from the URL string
      const match = gitRepoUrl.match(/(?:github\.com|gitlab\.com)[/:]([^/]+)\/([^/]+?)(?:\.git)?(?:\/|$)/);
      if (match) {
        const [, owner, repo] = match;
        if (gitHost === 'github') {
          return `https://github.com/${owner}/${repo}/settings`;
        } else if (gitHost === 'gitlab') {
          return `https://gitlab.com/${owner}/${repo}/-/settings/general`;
        }
      }
    }

    // Final fallback - return the original repo URL
    return gitRepoUrl.replace(/\.git$/, '');
  };

  const handleRefreshStatus = () => {
    refreshRepoStatusMutation.mutate({ projectId });
  };

  // Private Repository Dialog
  const PrivateRepoDialog = () => (
    <Dialog open={privateRepoDialogOpen} onOpenChange={setPrivateRepoDialogOpen}>
      <DialogContent className="sm:max-w-[500px] rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Repository is Private
          </DialogTitle>
          <DialogDescription>
            Your repository needs to be public to launch your project on our platform.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-none p-4">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              Why does my repository need to be public?
            </h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• Community members can discover and contribute to your project</li>
              <li>• Ensures transparency and builds trust with users</li>
              <li>• Allows proper validation of your project's authenticity</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">How to make your repository public:</h4>
            <ol className="text-sm text-muted-foreground space-y-1">
              <li>1. Go to your repository settings</li>
              <li>2. Scroll down to the "Danger Zone" section</li>
              <li>3. Click "Change visibility" and select "Public"</li>
              <li>4. Come back here and click "Check Status" to retry</li>
            </ol>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPrivateRepoDialogOpen(false)}
            className="rounded-none"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleRefreshStatus}
            disabled={refreshRepoStatusMutation.isPending}
            className="rounded-none"
          >
            {refreshRepoStatusMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin rounded-none" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4 rounded-none" />
                Check Status
              </>
            )}
          </Button>
          <Button
            onClick={() => window.open(getRepoSettingsUrl(), '_blank')}
            className="gap-2 rounded-none"
          >
            <ExternalLink className="h-4 w-4" />
            Repository Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      {isRepoPrivate ? (
        <>
          <Button
            className="gap-2 rounded-none"
            size="sm"
            onClick={() => setPrivateRepoDialogOpen(true)}
            variant="outline"
          >
            <Rocket className="h-4 w-4" />
            Launch Project
          </Button>
          <PrivateRepoDialog />
        </>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-none" size="sm">
              <Rocket className="h-4 w-4" />
              Launch Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] rounded-none">
            <DialogHeader>
              <DialogTitle>Launch {projectName}</DialogTitle>
              <DialogDescription>
                Launch your project to get it featured on the launches page. Make sure to craft a
                compelling tagline that describes what makes your project unique.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="tagline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tagline</FormLabel>
                      <FormControl>
                        <Input placeholder="A short, catchy description of your project" {...field} className="rounded-none" />
                      </FormControl>
                      <FormDescription>
                        This will be the first thing people see about your project
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="detailedDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detailed Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us more about your project, what problem it solves, key features, etc."
                          className="min-h-[120px] rounded-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide more context about your project for interested users
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-none">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={launchMutation.isPending} className="rounded-none">
                    {launchMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin rounded-none" />
                        Launching...
                      </>
                    ) : (
                      <>
                        <Rocket className="mr-2 h-4 w-4 rounded-none" />
                        Launch Project
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
