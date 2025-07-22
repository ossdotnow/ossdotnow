'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useState } from 'react';
import { track as vercelTrack } from '@vercel/analytics/react';
import { track as databuddyTrack } from '@databuddy/sdk';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod/v4';

// UI Components
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@workspace/ui/components/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { MultiSelect } from '@workspace/ui/components/multi-select';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Textarea } from '@workspace/ui/components/textarea';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';

import { projectProviderEnum } from '@workspace/db/schema';
import { useTRPC } from '@/hooks/use-trpc';
import { submisionForm } from '@/forms';

type FormData = z.infer<typeof submisionForm>;

interface EditProjectFormProps {
  projectId: string;
  initialData: FormData;
  onSuccess?: () => void;
}

export function useUpdateProject(onSuccess?: () => void) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending } = useMutation(
    trpc.projects.updateProject.mutationOptions({
      onSuccess: () => {
        setError(null);
        queryClient.invalidateQueries();
        toast.success('Project updated successfully!');

        vercelTrack('project_update_success');
        databuddyTrack('project_update_success');
        onSuccess?.();
      },
      onError: (err) => {
        const errorMessage = err.message || 'Something went wrong. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
        vercelTrack('project_update_error', { error: errorMessage });
        databuddyTrack('project_update_error', { error: errorMessage });
      },
    }),
  );

  const clearError = () => setError(null);

  return {
    updateProject: mutate,
    error,
    isLoading: isPending,
    clearError,
  };
}

export function EditProjectForm({ projectId, initialData, onSuccess }: EditProjectFormProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());
  const [repoValidation, setRepoValidation] = useState<{
    isValidating: boolean;
    isValid: boolean | null;
    message: string | null;
  }>({
    isValidating: false,
    isValid: null,
    message: null,
  });

  const { updateProject, error, isLoading, clearError } = useUpdateProject(onSuccess);
  const trpc = useTRPC();

  // Fetch categories from database
  const { data: projectTypes, isLoading: projectTypesLoading } = useQuery(
    trpc.categories.getProjectTypes.queryOptions({ activeOnly: true }),
  );
  const { data: projectStatuses, isLoading: projectStatusesLoading } = useQuery(
    trpc.categories.getProjectStatuses.queryOptions({ activeOnly: true }),
  );
  const { data: tags } = useQuery(trpc.categories.getTags.queryOptions({ activeOnly: true }));

  const form = useForm<FormData>({
    resolver: zodResolver(submisionForm),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: initialData,
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);

      // Set selected platforms based on initial data
      const platforms = new Set<string>();
      Object.entries(initialData.socialLinks || {}).forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim() !== '') {
          platforms.add(key);
        }
      });
      setSelectedPlatforms(platforms);
    }
  }, [initialData, form]);

  const parseRepositoryUrl = (
    input: string,
  ): { repo: string; host: (typeof projectProviderEnum.enumValues)[number] } | null => {
    const trimmedInput = input.trim();

    const githubPatterns = [
      /^https?:\/\/github\.com\/([^/]+)\/([^/\s]+?)(?:\.git)?(?:\/.*)?$/,
      /^git@github\.com:([^/]+)\/([^/\s]+?)(?:\.git)?$/,
      /^github\.com\/([^/]+)\/([^/\s]+?)(?:\.git)?(?:\/.*)?$/,
    ];

    const gitlabPatterns = [
      /^https?:\/\/gitlab\.com\/([^/]+)\/([^/\s]+?)(?:\.git)?(?:\/.*)?$/,
      /^git@gitlab\.com:([^/]+)\/([^/\s]+?)(?:\.git)?$/,
      /^gitlab\.com\/([^/]+)\/([^/\s]+?)(?:\.git)?(?:\/.*)?$/,
    ];

    for (const pattern of githubPatterns) {
      const match = trimmedInput.match(pattern);
      if (match?.[1] && match?.[2]) {
        return {
          repo: `${match[1]}/${match[2]}`,
          host: 'github',
        };
      }
    }

    for (const pattern of gitlabPatterns) {
      const match = trimmedInput.match(pattern);
      if (match?.[1] && match?.[2]) {
        return {
          repo: `${match[1]}/${match[2]}`,
          host: 'gitlab',
        };
      }
    }

    return null;
  };

  useEffect(() => {
    const subscription = form.watch(() => {
      if (error) {
        clearError();
      }
    });
    return () => subscription.unsubscribe();
  }, [form, error, clearError]);

  const socialPlatforms = [
    { value: 'website' as const, label: 'Website', placeholder: 'https://example.com' },
    { value: 'twitter' as const, label: 'Twitter', placeholder: 'https://twitter.com/username' },
    {
      value: 'linkedin' as const,
      label: 'LinkedIn',
      placeholder: 'https://linkedin.com/in/username',
    },
    {
      value: 'discord' as const,
      label: 'Discord',
      placeholder: 'https://discord.gg/username',
    },
  ];

  function handleProjectUpdate(formData: FormData) {
    updateProject({
      id: projectId,
      ...formData,
      status: formData.status || '',
      type: formData.type || '',
    });
  }

  const onSubmit = async (data: FormData) => {
    // Validate repository if it has changed
    const currentRepoUrl = form.getValues('gitRepoUrl');
    if (
      currentRepoUrl &&
      currentRepoUrl.trim() !== '' &&
      currentRepoUrl !== initialData.gitRepoUrl
    ) {
      if (repoValidation.isValidating) {
        toast.error('Please wait for repository validation to complete.');
        return;
      }
      if (repoValidation.isValid === false) {
        toast.error('Please enter a valid repository before submitting.');
        return;
      }
    }

    handleProjectUpdate(data);
  };

  return (
    <div className="mx-auto w-full p-4">
      {error && (
        <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-md p-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Repository Information */}
          <div className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="gitHost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Git Hosting Platform</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        const gitRepoUrl = form.getValues('gitRepoUrl');
                      }}
                      value={field.value || 'github'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select git host" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="github">GitHub</SelectItem>
                        <SelectItem value="gitlab">GitLab</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Select where your repository is hosted.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gitRepoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repository Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="ossdotnow/ossdotnow or https://github.com/owner/repo"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            const parsed = parseRepositoryUrl(inputValue);

                            if (parsed) {
                              field.onChange(parsed.repo);
                              form.setValue('gitHost', parsed.host);
                            } else {
                              field.onChange(inputValue);
                              const gitHost = form.getValues('gitHost') || 'github';
                            }
                          }}
                        />
                        <div className="absolute top-1/2 right-3 -translate-y-1/2">
                          {repoValidation.isValidating && (
                            <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                          )}
                          {!repoValidation.isValidating && repoValidation.isValid === true && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {!repoValidation.isValidating && repoValidation.isValid === false && (
                            <AlertCircle className="text-destructive h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      {repoValidation.message ||
                        'Enter as username/repository or paste a full GitHub/GitLab URL'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Basic Information</h2>
              <p className="text-muted-foreground text-sm">Update your project details</p>
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Awesome Project" {...field} />
                    </FormControl>
                    <FormDescription>The name of your project.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your project..."
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a clear, concise description of what your project does and its main
                      features.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Project Details */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Project Details</h2>
              <p className="text-muted-foreground text-sm">Categorize your project</p>
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projectStatusesLoading ? (
                          <div className="text-muted-foreground px-3 py-2 text-sm">
                            Loading statuses...
                          </div>
                        ) : (
                          (projectStatuses || []).map((status) => (
                            <SelectItem key={status.id} value={status.name}>
                              {status.displayName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Indicate the current development stage of your project.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projectTypesLoading ? (
                          <div className="text-muted-foreground px-3 py-2 text-sm">
                            Loading types...
                          </div>
                        ) : (
                          (projectTypes || []).map((type) => (
                            <SelectItem key={type.id} value={type.name}>
                              {type.displayName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the category that best describes your project's primary focus area.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Tags</FormLabel>
                    <FormControl>
                      <MultiSelect
                        placeholder="Select tags..."
                        options={(tags || []).map((tag) => ({
                          label: tag.displayName,
                          value: tag.name,
                        }))}
                        selected={field.value ?? []}
                        onChange={(value) => {
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>Add tags to help categorize your project.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Social Links</h2>
              <p className="text-muted-foreground text-sm">
                Add links to help people connect with your project and team.
              </p>
            </div>

            <div className="space-y-4">
              <MultiSelect
                onChange={(value) => {
                  setSelectedPlatforms(new Set(value));
                }}
                options={socialPlatforms}
                selected={Array.from(selectedPlatforms)}
                placeholder="Select social platforms..."
              />

              <div className="space-y-4">
                {socialPlatforms.map(
                  (platform) =>
                    selectedPlatforms.has(platform.value) && (
                      <FormField
                        key={platform.value}
                        control={form.control}
                        name={`socialLinks.${platform.value}`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{platform.label} URL</FormLabel>
                            <FormControl>
                              <Input placeholder={platform.placeholder} {...field} />
                            </FormControl>
                            <FormDescription>
                              {platform.value === 'website' &&
                                "Your project's official website or documentation"}
                              {platform.value === 'twitter' &&
                                'Twitter/X profile for project updates and announcements'}
                              {platform.value === 'linkedin' &&
                                'LinkedIn profile for professional networking'}
                              {platform.value === 'discord' &&
                                'Discord server or profile for community discussions'}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ),
                )}
              </div>
            </div>
          </div>

          {/* Project Options */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Project Options</h2>
              <p className="text-muted-foreground text-sm">
                Let the community know how they can get involved with your project.
              </p>
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="isLookingForContributors"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Looking for Contributors</FormLabel>
                      <FormDescription>
                        Enable this if you're actively seeking developers to contribute code,
                        documentation, or other improvements to your project.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isHiring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Currently Hiring</FormLabel>
                      <FormDescription>
                        Enable this if your project or organization has open positions and you're
                        looking to hire team members.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <Button type="button" variant="outline" onClick={() => window.history.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Project'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
