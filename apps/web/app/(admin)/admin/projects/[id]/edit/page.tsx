'use client';

import {
  categoryProjectStatuses,
  categoryProjectTypes,
  categoryTags,
  project,
  projectApprovalStatusEnum,
  projectProviderEnum,
} from '@workspace/db/schema';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
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
import { AlertCircle, ArrowLeft, CheckCircle, Loader2, Save } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MultiSelect } from '@workspace/ui/components/multi-select';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Textarea } from '@workspace/ui/components/textarea';
import { Switch } from '@workspace/ui/components/switch';
import { Badge } from '@workspace/ui/components/badge';
import { Separator } from '@workspace/ui/components/separator';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTRPC } from '@/hooks/use-trpc';
import { toast } from 'sonner';
import { z } from 'zod/v4';
import Link from '@workspace/ui/components/link';
import React from 'react';
import { useCallback, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';

type Project = typeof project.$inferSelect & {
  status: typeof categoryProjectStatuses.$inferSelect | null;
  type: typeof categoryProjectTypes.$inferSelect | null;
  tagRelations: Array<{
    tag: typeof categoryTags.$inferSelect | null;
  }>;
};

const editProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().default(''),
  gitRepoUrl: z.string().min(1, 'Repository URL is required'),
  gitHost: z.enum(projectProviderEnum.enumValues),
  logoUrl: z.string().default(''),
  approvalStatus: z.enum(projectApprovalStatusEnum.enumValues),
  status: z.string().min(1, 'Project status is required'),
  type: z.string().min(1, 'Project type is required'),
  tags: z.array(z.string()),
  socialLinks: z.object({
    twitter: z.string().default(''),
    discord: z.string().default(''),
    linkedin: z.string().default(''),
    website: z.string().default(''),
  }).default({
    twitter: '',
    discord: '',
    linkedin: '',
    website: '',
  }),
  isLookingForContributors: z.boolean().default(false),
  isLookingForInvestors: z.boolean().default(false),
  isHiring: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  hasBeenAcquired: z.boolean().default(false),
  isPinned: z.boolean().default(false),
  isRepoPrivate: z.boolean().default(false),
});

type EditProjectFormData = z.infer<typeof editProjectSchema>;

export default function AdminProjectEditPage() {
  const params = useParams();
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const projectId = params.id as string;

  const { data: projectData, isLoading: projectLoading } = useQuery(
    trpc.projects.getProject.queryOptions({ id: projectId }),
  );

  const { data: projectTypes, isLoading: projectTypesLoading } = useQuery(
    trpc.categories.getProjectTypes.queryOptions({ activeOnly: false }),
  );

  const { data: projectStatuses, isLoading: projectStatusesLoading } = useQuery(
    trpc.categories.getProjectStatuses.queryOptions({ activeOnly: false }),
  );

  const { data: tags, isLoading: tagsLoading } = useQuery(
    trpc.categories.getTags.queryOptions({ activeOnly: false }),
  );

  const updateProjectMutation = useMutation({
    ...trpc.projects.updateProject.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.projects.getProjectsAdmin.queryKey({}),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.projects.getProject.queryKey({ id: projectId }),
      });
      toast.success('Project updated successfully');
      router.push('/admin/projects');
    },
    onError: (error) => {
      toast.error(`Failed to update project: ${error.message}`);
    },
  });

  const form = useForm({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      name: '',
      description: '',
      gitRepoUrl: '',
      gitHost: 'github' as const,
      logoUrl: '',
      approvalStatus: 'pending' as const,
      status: '',
      type: '',
      tags: [],
      socialLinks: {
        twitter: '',
        discord: '',
        linkedin: '',
        website: '',
      },
      isLookingForContributors: false,
      isLookingForInvestors: false,
      isHiring: false,
      isPublic: false,
      hasBeenAcquired: false,
      isPinned: false,
      isRepoPrivate: false,
    },
  });

  // Set form values when project data loads
  React.useEffect(() => {
    if (projectData && !projectStatusesLoading && !projectTypesLoading && !tagsLoading) {
      const currentTags = projectData.tagRelations?.map(relation => relation.tag?.name).filter(Boolean) ?? [];

      const formData = {
        name: projectData.name,
        description: projectData.description || '',
        gitRepoUrl: projectData.gitRepoUrl,
        gitHost: projectData.gitHost || 'github',
        logoUrl: projectData.logoUrl || '',
        approvalStatus: projectData.approvalStatus,
        status: projectData.status?.name || '',
        type: projectData.type?.name || '',
        tags: currentTags,
        socialLinks: {
          twitter: projectData.socialLinks?.twitter || '',
          discord: projectData.socialLinks?.discord || '',
          linkedin: projectData.socialLinks?.linkedin || '',
          website: projectData.socialLinks?.website || '',
        },
        isLookingForContributors: projectData.isLookingForContributors,
        isLookingForInvestors: projectData.isLookingForInvestors,
        isHiring: projectData.isHiring,
        isPublic: projectData.isPublic,
        hasBeenAcquired: projectData.hasBeenAcquired,
        isPinned: projectData.isPinned,
        isRepoPrivate: projectData.isRepoPrivate,
      };

      console.log('Setting form data:', formData);
      form.reset(formData);
    }
  }, [projectData, projectStatusesLoading, projectTypesLoading, tagsLoading, form]);

  // Repository validation state
  const [repoValidation, setRepoValidation] = useState<{
    isValidating: boolean;
    isValid: boolean | null;
    message: string | null;
  }>({
    isValidating: false,
    isValid: null,
    message: null,
  });

  // Confirmation dialog state
  const [showRepoChangeDialog, setShowRepoChangeDialog] = useState(false);
  const [pendingRepoChange, setPendingRepoChange] = useState<{
    gitRepoUrl: string;
    gitHost: (typeof projectProviderEnum.enumValues)[number];
  } | null>(null);

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
      if (match && match[1] && match[2]) {
        return {
          repo: `${match[1]}/${match[2]}`,
          host: 'github',
        };
      }
    }

    for (const pattern of gitlabPatterns) {
      const match = trimmedInput.match(pattern);
      if (match && match[1] && match[2]) {
        return {
          repo: `${match[1]}/${match[2]}`,
          host: 'gitlab',
        };
      }
    }

    return null;
  };

  const validateRepository = useCallback(
    async (repoUrl: string, gitHost: string) => {
      if (!repoUrl || repoUrl.trim() === '') {
        setRepoValidation({
          isValidating: false,
          isValid: null,
          message: null,
        });
        return;
      }

      const formatRegex = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+$/;
      if (!formatRegex.test(repoUrl)) {
        setRepoValidation({
          isValidating: false,
          isValid: false,
          message: 'Invalid format. Use: username/repository',
        });
        return;
      }

      setRepoValidation({
        isValidating: true,
        isValid: null,
        message: null,
      });

      try {
        const result = await queryClient.fetchQuery(
          trpc.repository.getRepo.queryOptions({
            url: repoUrl,
            provider: gitHost as (typeof projectProviderEnum.enumValues)[number],
          }),
        );

        if (result) {
          setRepoValidation({
            isValidating: false,
            isValid: true,
            message: result.isPrivate
              ? 'Private repository detected. Admin cannot modify private repos without proper credentials.'
              : 'Repository found and available!',
          });
        }
      } catch (error) {
        console.error('Repository validation error:', error);
        setRepoValidation({
          isValidating: false,
          isValid: false,
          message: 'Repository not found or unable to access',
        });
      }
    },
    [queryClient, trpc],
  );

  const debouncedValidateRepo = useDebouncedCallback((repoUrl: string, gitHost: string) => {
    validateRepository(repoUrl, gitHost);
  }, 500);

  const handleRepoChange = (newRepoUrl: string, newGitHost: (typeof projectProviderEnum.enumValues)[number]) => {
    const currentRepoUrl = form.getValues('gitRepoUrl');
    const currentGitHost = form.getValues('gitHost');

    // If the repository URL or host has changed
    if (newRepoUrl !== currentRepoUrl || newGitHost !== currentGitHost) {
      // Check if the current project is a private repo
      if (projectData?.isRepoPrivate) {
        toast.error('Cannot modify repository URL for private repositories without proper credentials.');
        return;
      }

      // Just update the form without showing dialog immediately
      form.setValue('gitRepoUrl', newRepoUrl);
      form.setValue('gitHost', newGitHost);
      debouncedValidateRepo(newRepoUrl, newGitHost);
    } else {
      // No change, just update the form
      form.setValue('gitRepoUrl', newRepoUrl);
      form.setValue('gitHost', newGitHost);
      debouncedValidateRepo(newRepoUrl, newGitHost);
    }
  };

  const confirmRepoChange = () => {
    if (pendingRepoChange) {
      // Update form with the pending changes
      form.setValue('gitRepoUrl', pendingRepoChange.gitRepoUrl);
      form.setValue('gitHost', pendingRepoChange.gitHost);

      // Close dialog and clear pending changes
      setShowRepoChangeDialog(false);
      setPendingRepoChange(null);

      // Get the current form data and save
      const formData = form.getValues();
      updateProjectMutation.mutate({
        id: projectId,
        ...formData,
      });
    }
  };

  const cancelRepoChange = () => {
    setShowRepoChangeDialog(false);
    setPendingRepoChange(null);
  };

  const onSubmit = (data: EditProjectFormData) => {
    // Check if repository URL has changed
    const originalRepoUrl = projectData?.gitRepoUrl;
    const originalGitHost = projectData?.gitHost;

    if (data.gitRepoUrl !== originalRepoUrl || data.gitHost !== originalGitHost) {
      // Check if the current project is a private repo
      if (projectData?.isRepoPrivate) {
        toast.error('Cannot modify repository URL for private repositories without proper credentials.');
        return;
      }

      // Show confirmation dialog
      setPendingRepoChange({ gitRepoUrl: data.gitRepoUrl, gitHost: data.gitHost });
      setShowRepoChangeDialog(true);
      return;
    }

    // No repository changes, proceed with save
    updateProjectMutation.mutate({
      id: projectId,
      ...data,
    });
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Project not found</h2>
          <p className="text-muted-foreground">The project you're looking for doesn't exist.</p>
          <Button asChild className="mt-4">
            <Link href="/admin/projects">Back to Projects</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6">
      <div className="mx-auto max-w-[1080px] py-4">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/admin/projects">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Edit Project</h1>
            <p className="text-neutral-400">
              Update project details and settings
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="flex min-w-0 flex-col gap-4 overflow-hidden lg:col-span-2">
                <div className="border border-neutral-800 bg-neutral-900/50 p-6">
                  <h2 className="mb-4 text-lg font-semibold text-white">Project Information</h2>
                  <p className="mb-6 text-sm text-neutral-400">
                    Core project details, classification, and social links
                  </p>

                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-4 text-md font-medium text-white">Basic Information</h3>
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
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe your project..."
                                  className="min-h-[100px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="gitRepoUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Repository URL</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    placeholder="owner/repository"
                                    {...field}
                                    disabled={projectData?.isRepoPrivate}
                                    value={field.value ?? ''}
                                    onChange={(e) => {
                                      const inputValue = e.target.value;
                                      const parsed = parseRepositoryUrl(inputValue);

                                      if (parsed) {
                                        handleRepoChange(parsed.repo, parsed.host);
                                      } else {
                                        const gitHost = form.getValues('gitHost') || 'github';
                                        handleRepoChange(inputValue, gitHost);
                                      }
                                    }}
                                    onPaste={async (e) => {
                                      let pastedText = '';

                                      try {
                                        if (navigator.clipboard && navigator.clipboard.readText) {
                                          e.preventDefault();
                                          pastedText = await navigator.clipboard.readText();
                                        } else {
                                          e.preventDefault();
                                          pastedText = e.clipboardData.getData('text');
                                        }
                                      } catch (error) {
                                        console.error('error', error);
                                        setTimeout(() => {
                                          const inputValue = (e.target as HTMLInputElement).value;
                                          const parsed = parseRepositoryUrl(inputValue);
                                          if (parsed) {
                                            handleRepoChange(parsed.repo, parsed.host);
                                          } else {
                                            const gitHost = form.getValues('gitHost') || 'github';
                                            handleRepoChange(inputValue, gitHost);
                                          }
                                        }, 0);
                                        return;
                                      }

                                      if (pastedText) {
                                        const parsed = parseRepositoryUrl(pastedText);
                                        if (parsed) {
                                          handleRepoChange(parsed.repo, parsed.host);
                                        } else {
                                          const gitHost = form.getValues('gitHost') || 'github';
                                          handleRepoChange(pastedText, gitHost);
                                        }
                                      }
                                    }}
                                  />
                                  <div className="absolute top-1/2 right-2 -translate-y-1/2">
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
                                {projectData?.isRepoPrivate
                                  ? 'Cannot modify repository URL for private repositories'
                                  : repoValidation.message || 'The repository identifier (e.g., username/repo-name)'
                                }
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="gitHost"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Git Provider</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  const gitRepoUrl = form.getValues('gitRepoUrl');
                                  if (gitRepoUrl && gitRepoUrl.trim() !== '') {
                                    handleRepoChange(gitRepoUrl, value as (typeof projectProviderEnum.enumValues)[number]);
                                  }
                                }}
                                value={field.value}
                                disabled={projectData?.isRepoPrivate}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {projectProviderEnum.enumValues.map((provider) => (
                                    <SelectItem key={provider} value={provider}>
                                      {provider.charAt(0).toUpperCase() + provider.slice(1)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="logoUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Logo URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://example.com/logo.png" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator className="bg-neutral-700" />

                    <div>
                      <h3 className="mb-4 text-md font-medium text-white">Project Classification</h3>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="approvalStatus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Approval Status</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {projectApprovalStatusEnum.enumValues.map((status) => (
                                    <SelectItem key={status} value={status}>
                                      <div className="flex items-center gap-2">
                                        <Badge
                                          variant="outline"
                                          className={
                                            status === 'approved'
                                              ? 'text-green-500'
                                              : status === 'rejected'
                                              ? 'text-red-500'
                                              : 'text-yellow-500'
                                          }
                                        >
                                          {status}
                                        </Badge>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

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
                                    <SelectItem value="" disabled>
                                      Loading statuses...
                                    </SelectItem>
                                  ) : (
                                    (projectStatuses || []).map((status) => (
                                      <SelectItem key={status.id} value={status.name}>
                                        {status.displayName}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Project Type</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select project type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {projectTypesLoading ? (
                                    <SelectItem value="" disabled>
                                      Loading types...
                                    </SelectItem>
                                  ) : (
                                    (projectTypes || []).map((type) => (
                                      <SelectItem key={type.id} value={type.name}>
                                        {type.displayName}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="tags"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tags</FormLabel>
                              <FormControl>
                                <MultiSelect
                                  options={
                                    tags?.map((tag) => ({
                                      label: tag.displayName,
                                      value: tag.name,
                                    })) || []
                                  }
                                  selected={field.value}
                                  onChange={field.onChange}
                                  placeholder="Select tags..."
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator className="bg-neutral-700" />

                    <div>
                      <h3 className="mb-4 text-md font-medium text-white">Social Links</h3>
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="socialLinks.website"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Website</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="socialLinks.twitter"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Twitter</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://twitter.com/username" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="socialLinks.linkedin"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>LinkedIn</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://linkedin.com/in/username" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="socialLinks.discord"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Discord</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://discord.gg/invite" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 lg:col-span-1">
                <div className="border border-neutral-800 bg-neutral-900/50 p-4 md:p-6">
                  <h2 className="mb-4 text-lg font-semibold text-white">Project Settings</h2>
                  <div className="space-y-4">
                    <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="isLookingForContributors"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Looking for Contributors</FormLabel>
                          <FormDescription>
                            Enable if the project is actively seeking contributors
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isLookingForInvestors"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Looking for Investors</FormLabel>
                          <FormDescription>
                            Enable if the project is seeking investment
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
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Hiring</FormLabel>
                          <FormDescription>
                            Enable if the project is actively hiring
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Public</FormLabel>
                          <FormDescription>
                            Enable if the project should be publicly visible
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hasBeenAcquired"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Acquired</FormLabel>
                          <FormDescription>
                            Enable if the project has been acquired
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isPinned"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Pinned</FormLabel>
                          <FormDescription>
                            Enable to pin this project to the top of listings
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isRepoPrivate"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Repository Private</FormLabel>
                          <FormDescription>
                            Enable if the repository is private
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button variant="outline" asChild className="rounded-none">
                    <Link href="/admin/projects">Cancel</Link>
                  </Button>
                  <Button type="submit" disabled={updateProjectMutation.isPending} className="rounded-none">
                    {updateProjectMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Form>

        {/* Repository Change Confirmation Dialog */}
        <Dialog open={showRepoChangeDialog} onOpenChange={setShowRepoChangeDialog}>
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
              <Button variant="outline" onClick={cancelRepoChange}>
                Cancel
              </Button>
              <Button onClick={confirmRepoChange}>
                Confirm Change
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
