'use client';

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
import { AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { MultiSelect } from '@workspace/ui/components/multi-select';
import { DialogFooter } from '@workspace/ui/components/dialog';
import { track as vercelTrack } from '@vercel/analytics/react';
import { Textarea } from '@workspace/ui/components/textarea';
import { Progress } from '@workspace/ui/components/progress';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { projectProviderEnum } from '@workspace/db/schema';
import { Button } from '@workspace/ui/components/button';
import { track as databuddyTrack } from '@databuddy/sdk';
import { useCallback, useEffect, useState } from 'react';
import { Input } from '@workspace/ui/components/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDebouncedCallback } from 'use-debounce';
// import { UploadDropzone } from '@/lib/uploadthing';
import { editProjectForm } from '@/forms';
import { env } from '@workspace/env/client';
import { useTRPC } from '@/hooks/use-trpc';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod/v4';

interface EditProjectFormProps {
  projectId: string;
  initialData?: any;
}

function useEditProject() {
  const trpc = useTRPC();
  const [isMounted, setIsMounted] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    setSuccess(localStorage.getItem('edit-project-success') === 'true');
  }, []);

  const { mutate, isPending } = useMutation(
    trpc.projects.updateProject.mutationOptions({
      onSuccess: () => {
        setSuccess(true);
        setError(null);

        if (isMounted) {
          localStorage.setItem('edit-project-success', 'true');
        }
        vercelTrack('edit_project_success');
        databuddyTrack('edit_project_success');
      },
      onError: (err: any) => {
        const errorMessage = err.message || 'Something went wrong. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
        vercelTrack('edit_project_error', { error: errorMessage });
        databuddyTrack('edit_project_error', { error: errorMessage });
      },
    }),
  );

  const clearError = () => setError(null);

  return {
    mutate,
    success,
    error,
    isLoading: isPending,
    clearError,
  };
}

export default function EditProjectForm({ projectId, initialData }: EditProjectFormProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [repoValidation, setRepoValidation] = useState<{
    isValidating: boolean;
    isValid: boolean | null;
    message: string | null;
  }>({
    isValidating: false,
    isValid: null,
    message: null,
  });
  const { mutate, success, error, isLoading, clearError } = useEditProject();
  const trpc = useTRPC();
  const formSchema = editProjectForm;

  // Fetch project data if not provided
  const { data: projectData, isLoading: projectLoading } = useQuery({
    ...trpc.projects.getProject.queryOptions({ id: projectId }),
    enabled: !initialData,
  });

  const project = initialData || projectData;

  // Fetch categories from database
  const { data: projectTypes, isLoading: projectTypesLoading } = useQuery(
    trpc.categories.getProjectTypes.queryOptions({ activeOnly: true }),
  );
  const { data: projectStatuses, isLoading: projectStatusesLoading } = useQuery(
    trpc.categories.getProjectStatuses.queryOptions({ activeOnly: true }),
  );
  const { data: tags, isLoading: tagsLoading } = useQuery(
    trpc.categories.getTags.queryOptions({ activeOnly: true }),
  );

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      id: projectId,
      name: project?.name || '',
      description: project?.description || '',
      logoUrl: project?.logoUrl || '',
      gitRepoUrl: project?.gitRepoUrl || '',
      gitHost: project?.gitHost || 'github',
      status: project?.status || '',
      type: project?.type || '',
      socialLinks: {
        twitter: project?.socialLinks?.twitter || '',
        discord: project?.socialLinks?.discord || '',
        linkedin: project?.socialLinks?.linkedin || '',
        website: project?.socialLinks?.website || '',
      },
      tags: project?.tags || [],
      isLookingForContributors: project?.isLookingForContributors || false,
      isLookingForInvestors: project?.isLookingForInvestors || false,
      isHiring: project?.isHiring || false,
      isPublic: project?.isPublic ?? true,
      hasBeenAcquired: project?.hasBeenAcquired || false,
    },
  });

  // Update form when project data loads
  useEffect(() => {
    if (project) {
      // Set social platforms based on existing data
      const platforms = new Set<string>();
      if (project.socialLinks?.twitter) platforms.add('twitter');
      if (project.socialLinks?.discord) platforms.add('discord');
      if (project.socialLinks?.linkedin) platforms.add('linkedin');
      if (project.socialLinks?.website) platforms.add('website');
      setSelectedPlatforms(platforms);

      // Update form values
      form.reset({
        id: projectId,
        name: project.name || '',
        description: project.description || '',
        logoUrl: project.logoUrl || '',
        gitRepoUrl: project.gitRepoUrl || '',
        gitHost: project.gitHost || 'github',
        status: project.status || '',
        type: project.type || '',
        socialLinks: {
          twitter: project.socialLinks?.twitter || '',
          discord: project.socialLinks?.discord || '',
          linkedin: project.socialLinks?.linkedin || '',
          website: project.socialLinks?.website || '',
        },
        tags: project.tags || [],
        isLookingForContributors: project.isLookingForContributors || false,
        isLookingForInvestors: project.isLookingForInvestors || false,
        isHiring: project.isHiring || false,
        isPublic: project.isPublic ?? true,
        hasBeenAcquired: project.hasBeenAcquired || false,
      });
    }
  }, [project, projectId, form]);

  const { trigger } = form;

  const queryClient = useQueryClient();

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
            url: repoUrl, // org/repo
            provider: gitHost as (typeof projectProviderEnum.enumValues)[number],
          }),
        );

        console.log('result', result);

        if (result) {
          setRepoValidation({
            isValidating: false,
            isValid: true,
            message: 'Repository found!',
          });

          if (result.name) {
            form.setValue('name', result.name, { shouldValidate: true });
          }

          if (result.description) {
            form.setValue('description', result.description, { shouldValidate: true });
          }
        }
      } catch (error) {
        setRepoValidation({
          isValidating: false,
          isValid: false,
          message: 'Repository not found or is private',
        });
      }
    },
    [queryClient, trpc, form],
  );

  const debouncedValidateRepo = useDebouncedCallback((repoUrl: string, gitHost: string) => {
    validateRepository(repoUrl, gitHost);
  }, 500);

  useEffect(() => {
    const subscription = form.watch(() => {
      if (error) {
        clearError();
      }
    });
    return () => subscription.unsubscribe();
  }, [form, error, clearError]);

  const steps = [
    {
      id: 'basic-information',
      title: 'Basic Information',
      description: 'Tell us about your project',
      fields: ['description', 'logoUrl'] as (keyof FormData)[],
    },
    {
      id: 'project-details',
      title: 'Project Details',
      description: 'What are you interested in?',
      fields: ['status', 'type', 'tags'] as (keyof FormData)[],
    },
    {
      id: 'extra-information',
      title: 'Extra Information',
      description: 'Tell us more about yourself',
      fields: ['isLookingForContributors', 'isHiring'] as (keyof FormData)[],
    },
  ];

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

  function handleProjectSubmission(formData: FormData) {
    mutate({
      ...formData,
      status: formData.status || '',
      type: formData.type || '',
      gitHost: formData.gitHost as 'github' | 'gitlab' | null | undefined,
    });
  }

  const nextStep = async () => {
    const currentStepFields = steps[currentStep]?.fields;
    if (!currentStepFields) return;

    let fieldsToValidate: string[] = [...currentStepFields];

    if (currentStep === 2) {
      const socialLinkFields = Array.from(selectedPlatforms).map(
        (platform) => `socialLinks.${platform}`,
      );
      fieldsToValidate = [...fieldsToValidate, ...socialLinkFields];
    }

    const isStepValid = await trigger(fieldsToValidate as any);

    if (isStepValid) {
      const errors = form.formState.errors;
      const hasErrors = fieldsToValidate.some((field) => {
        const fieldParts = field.split('.');
        let error: any = errors;
        for (const part of fieldParts) {
          error = error?.[part];
        }
        return !!error;
      });

      if (!hasErrors) {
        if (!completedSteps.includes(currentStep)) {
          setCompletedSteps([...completedSteps, currentStep]);
        }
        setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
      } else {
        toast.error('Please fill in all required fields correctly.');
      }
    } else {
      toast.error('Please fill in all required fields.');
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading project...</span>
      </div>
    );
  }

  return success && env.NEXT_PUBLIC_ENV === 'production' ? (
    <div className="flex flex-col items-center justify-center space-y-4 py-8">
      <CheckCircle className="h-16 w-16 text-green-500" />
      <h3 className="text-xl font-semibold">Project Updated Successfully!</h3>
      <p className="text-muted-foreground text-center">
        Your project has been updated successfully.
      </p>
    </div>
  ) : (
    <>
      <Progress value={progress} className="w-full" />
      {error && (
        <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-md p-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      <Form {...form}>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (currentStep !== steps.length - 1) {
              await nextStep();
              return;
            }
            const isValid = await form.trigger();
            if (isValid) {
              form.handleSubmit(handleProjectSubmission)(e);
            } else {
              toast.error('Please fix all validation errors before submitting.');
            }
          }}
          className="space-y-6 text-left"
        >
          {currentStep === 0 && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input
                        className="border-border z-10 rounded-none border !bg-[#1D1D1D]/100 text-base placeholder:text-[#9f9f9f]"
                        placeholder="My Awesome Project"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The name of your project.
                    </FormDescription>
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
                      <Input
                        className="border-border z-10 rounded-none border !bg-[#1D1D1D]/100 text-base placeholder:text-[#9f9f9f]"
                        placeholder="username/repository"
                        {...field}
                        disabled
                      />
                    </FormControl>
                    <FormDescription>
                      Repository name cannot be changed after creation.
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
                    <FormLabel>Git Hosting Platform</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || 'github'}
                      disabled
                    >
                      <FormControl>
                        <SelectTrigger className="border-border z-10 w-full rounded-none border !bg-[#1D1D1D]/100 text-base">
                          <SelectValue placeholder="Select git host" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-none">
                        <SelectItem className="rounded-none" value="github">
                          GitHub
                        </SelectItem>
                        <SelectItem className="rounded-none" value="gitlab">
                          GitLab
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Git hosting platform cannot be changed after creation.
                    </FormDescription>
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
                        className="border-border z-10 rounded-none border !bg-[#1D1D1D]/100 text-base placeholder:text-[#9f9f9f]"
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

              {/* <div className="flex flex-col gap-2">
                      <FormLabel>Logo</FormLabel>
                      <UploadDropzone
                        endpoint="project-logos"
                        onClientUploadComplete={(res) => {
                          const [file] = res ?? [];
                          if (file?.url) {
                            form.setValue('logoUrl', file.url, { shouldValidate: true });
                          }
                        }}
                        onUploadError={(error: Error) => {
                          console.error(`ERROR! ${error.message}`);
                        }}
                      />
                    </div> */}
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-border z-10 w-full rounded-none border !bg-[#1D1D1D]/100 text-base">
                          <SelectValue placeholder="Select project status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-none">
                        {projectStatusesLoading ? (
                          <SelectItem className="rounded-none" value="" disabled>
                            Loading statuses...
                          </SelectItem>
                        ) : (
                          (projectStatuses || []).map((status) => (
                            <SelectItem
                              key={status.id}
                              className="rounded-none"
                              value={status.name}
                            >
                              {status.displayName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Indicate the current development stage of your project. This helps set
                      appropriate expectations.
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
                        <SelectTrigger className="border-border z-10 w-full rounded-none border !bg-[#1D1D1D]/100 text-base">
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-none">
                        {projectTypesLoading ? (
                          <SelectItem className="rounded-none" value="" disabled>
                            Loading types...
                          </SelectItem>
                        ) : (
                          (projectTypes || []).map((type) => (
                            <SelectItem key={type.id} className="rounded-none" value={type.name}>
                              {type.displayName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the category that best describes your project&apos;s primary focus
                      area.
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
                        className="border-border z-10 rounded-none border !bg-[#1D1D1D]/100 text-base placeholder:text-[#9f9f9f]"
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
          )}

          {currentStep === 2 && (
            <>
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Social Links</h3>
                <p className="text-muted-foreground text-sm">
                  Add links to help people connect with your project and team.
                </p>

                <MultiSelect
                  className="border-border z-10 rounded-none border !bg-[#1D1D1D]/100 text-base placeholder:text-[#9f9f9f]"
                  onChange={(value) => {
                    setSelectedPlatforms(new Set(value));
                  }}
                  options={socialPlatforms}
                  selected={Array.from(selectedPlatforms)}
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
                                <Input
                                  className="border-border z-10 rounded-none border !bg-[#1D1D1D]/100 text-base placeholder:text-[#9f9f9f]"
                                  placeholder={platform.placeholder}
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                {platform.value === 'website' &&
                                  "Your project's official website or documentation"}
                                {platform.value === 'twitter' &&
                                  'Twitter/X profile for project updates and announcements'}
                                {platform.value === 'linkedin' &&
                                  'LinkedIn profile for professional networking'}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ),
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Project Options</h3>
                <p className="text-muted-foreground text-sm">
                  Let the community know how they can get involved with your project.
                </p>

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
                          Enable this if you&apos;re actively seeking developers to contribute code,
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
                          Enable this if your project or organization has open positions and
                          you&apos;re looking to hire team members.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </>
          )}

          <DialogFooter>
            <div className="flex justify-between gap-4 pt-6 pb-20">
              <Button
                type="button"
                variant="outline"
                className="rounded-none"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {currentStep === steps.length - 1 ? (
                <Button type="submit" className="rounded-none" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Project'}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    nextStep();
                  }}
                  className="rounded-none"
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
