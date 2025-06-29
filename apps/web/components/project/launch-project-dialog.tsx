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
import { Rocket, Loader2 } from 'lucide-react';
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
}

export function LaunchProjectDialog({ projectId, projectName }: LaunchProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<LaunchFormData>({
    resolver: zodResolver(launchSchema),
    defaultValues: {
      tagline: '',
      detailedDescription: '',
    },
  });

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
      onError: (error) => {
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-none" size="sm">
          <Rocket className="h-4 w-4" />
          Launch Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
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
                    <Input placeholder="A short, catchy description of your project" {...field} />
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
                      className="min-h-[120px]"
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
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={launchMutation.isPending}>
                {launchMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Launching...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-4 w-4" />
                    Launch Project
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
