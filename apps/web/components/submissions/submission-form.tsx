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
import { MultiSelect } from '@workspace/ui/components/multi-select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { tagsEnum } from '@workspace/db/schema';
// import { UploadDropzone } from '@/lib/uploadthing';
import { earlySubmissionForm } from '@/forms';
import { useTRPC } from '@/hooks/use-trpc';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod/v4';

function useEarlySubmission() {
  const trpc = useTRPC();
  const [isMounted, setIsMounted] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    setSuccess(localStorage.getItem('early-submission-success') === 'true');
  }, []);

  const { mutate, isPending } = useMutation(
    trpc.earlySubmission.addProject.mutationOptions({
      onSuccess: () => {
        setSuccess(true);
        setError(null);

        if (isMounted) {
          localStorage.setItem('early-submission-success', 'true');
        }
        vercelTrack('early_submission_success');
        databuddyTrack('early_submission_success');
      },
      onError: (err) => {
        const errorMessage = err.message || 'Something went wrong. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
        vercelTrack('early_submission_error', { error: errorMessage });
        databuddyTrack('early_submission_error', { error: errorMessage });
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

export default function SubmissionForm() {
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
  const { mutate, success, error, isLoading, clearError } = useEarlySubmission();
  const trpc = useTRPC();

  type FormData = z.infer<typeof earlySubmissionForm>;

  const form = useForm<FormData>({
    resolver: zodResolver(earlySubmissionForm),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      logoUrl: '',
      gitRepoUrl: '',
      gitHost: 'github',
      status: 'early-stage',
      type: 'other',
      socialLinks: {
        twitter: '',
        discord: '',
        linkedin: '',
        website: '',
      },
      tags: [],
      isLookingForContributors: false,
      isLookingForInvestors: false,
      isHiring: false,
      isPublic: true,
      hasBeenAcquired: false,
    },
  });

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

      if (gitHost === 'gitlab') {
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
          try {
            const duplicateCheck = await queryClient.fetchQuery(
              trpc.earlySubmission.checkDuplicateRepo.queryOptions({
                gitRepoUrl: repoUrl,
              }),
            );

            if (duplicateCheck.exists) {
              setRepoValidation({
                isValidating: false,
                isValid: false,
                message: `This repository has already been submitted! The project "${duplicateCheck.projectName}" has ${duplicateCheck.statusMessage}.`,
              });
              return;
            }

            setRepoValidation({
              isValidating: false,
              isValid: true,
              message: 'Repository found and available!',
            });

            if (result.name) {
              form.setValue('name', result.name, { shouldValidate: true });
            }

            if (result.description) {
              form.setValue('description', result.description, { shouldValidate: true });
            }
          } catch (duplicateError) {
            setRepoValidation({
              isValidating: false,
              isValid: true,
              message: 'Repository found! (could not verify if already submitted, awkward..)',
            });

            if (result.name) {
              form.setValue('name', result.name, { shouldValidate: true });
            }

            if (result.description) {
              form.setValue('description', result.description, { shouldValidate: true });
            }
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
      id: 'repository-information',
      title: 'Repository Information',
      description: 'Where is your code hosted?',
      fields: ['gitRepoUrl', 'gitHost'] as (keyof FormData)[],
    },
    {
      id: 'basic-information',
      title: 'Basic Information',
      description: 'Tell us about your project',
      fields: ['name', 'description', 'logoUrl'] as (keyof FormData)[],
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
    mutate(formData);
  }

  const nextStep = async () => {
    const currentStepFields = steps[currentStep]?.fields;
    if (!currentStepFields) return;

    let fieldsToValidate: string[] = [...currentStepFields];

    if (currentStep === 3) {
      const socialLinkFields = Array.from(selectedPlatforms).map(
        (platform) => `socialLinks.${platform}`,
      );
      fieldsToValidate = [...fieldsToValidate, ...socialLinkFields];
    }

    const isStepValid = await trigger(fieldsToValidate as any);

    if (currentStep === 0) {
      const gitRepoUrl = form.getValues('gitRepoUrl');
      if (gitRepoUrl && gitRepoUrl.trim() !== '') {
        if (repoValidation.isValidating) {
          toast.error('Please wait for repository validation to complete.');
          return;
        }
        if (repoValidation.isValid === false) {
          toast.error('Please enter a valid repository before continuing.');
          return;
        }
      }
    }

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

  const submissionCount =
    typeof window !== 'undefined'
      ? parseInt(localStorage.getItem('early-submission-count') ?? '0')
      : 0;

  return success ? (
    <div className="flex flex-col items-center justify-center space-y-4 py-8">
      <CheckCircle className="h-16 w-16 text-green-500" />
      <h3 className="text-xl font-semibold">Submission Successful!</h3>
      <p className="text-muted-foreground text-center">
        Thank you for submitting your project. We&apos;ll review it and get back to you soon.
      </p>
      <p className="text-muted-foreground text-sm">
        When everything is live you can login with your GitHub account to claim the projects as
        yours.
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
                name="gitHost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Git Hosting Platform</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        const gitRepoUrl = form.getValues('gitRepoUrl');
                        if (gitRepoUrl && gitRepoUrl.trim() !== '') {
                          debouncedValidateRepo(gitRepoUrl, value);
                        }
                      }}
                      value={field.value || 'github'}
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
                      Select where your repository is hosted. We currently support GitHub and
                      GitLab.
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
                      <div className="relative">
                        <Input
                          className="border-border z-10 rounded-none border !bg-[#1D1D1D]/100 pr-10 text-base placeholder:text-[#9f9f9f]"
                          placeholder="ossdotnow/ossdotnow or https://github.com/owner/repo"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            const parsed = parseRepositoryUrl(inputValue);

                            if (parsed) {
                              field.onChange(parsed.repo);
                              form.setValue('gitHost', parsed.host);
                              validateRepository(parsed.repo, parsed.host);
                            } else {
                              field.onChange(inputValue);
                              const gitHost = form.getValues('gitHost') || 'github';
                              debouncedValidateRepo(inputValue, gitHost);
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
                              setTimeout(() => {
                                const inputValue = (e.target as HTMLInputElement).value;
                                const parsed = parseRepositoryUrl(inputValue);
                                if (parsed) {
                                  field.onChange(parsed.repo);
                                  form.setValue('gitHost', parsed.host);
                                  validateRepository(parsed.repo, parsed.host);
                                } else {
                                  const gitHost = form.getValues('gitHost') || 'github';
                                  debouncedValidateRepo(inputValue, gitHost);
                                }
                              }, 0);
                              return;
                            }

                            if (pastedText) {
                              const parsed = parseRepositoryUrl(pastedText);
                              if (parsed) {
                                field.onChange(parsed.repo);
                                form.setValue('gitHost', parsed.host);
                                validateRepository(parsed.repo, parsed.host);
                              } else {
                                field.onChange(pastedText);
                                const gitHost = form.getValues('gitHost') || 'github';
                                debouncedValidateRepo(pastedText, gitHost);
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
                      {repoValidation.message ||
                        'Enter as username/repository or paste a full GitHub/GitLab URL'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {currentStep === 1 && (
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
                      The name of your project.{' '}
                      {form.getValues('gitRepoUrl') &&
                        'This was auto-filled from your repository, but you can change it if needed.'}
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
                      features.{' '}
                      {form.getValues('gitRepoUrl') &&
                        'This was auto-filled from your repository, but you can enhance it if needed.'}
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

          {currentStep === 2 && (
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
                        <SelectItem className="rounded-none" value="active">
                          Active - Currently being developed
                        </SelectItem>
                        <SelectItem className="rounded-none" value="inactive">
                          Inactive - Not currently maintained
                        </SelectItem>
                        <SelectItem className="rounded-none" value="early-stage">
                          Early Stage - Just getting started
                        </SelectItem>
                        <SelectItem className="rounded-none" value="beta">
                          Beta - Testing with limited users
                        </SelectItem>
                        <SelectItem className="rounded-none" value="production-ready">
                          Production Ready - Stable for use
                        </SelectItem>
                        <SelectItem className="rounded-none" value="experimental">
                          Experimental - Proof of concept
                        </SelectItem>
                        <SelectItem className="rounded-none" value="cancelled">
                          Cancelled - No longer pursuing
                        </SelectItem>
                        <SelectItem className="rounded-none" value="paused">
                          Paused - Temporarily on hold
                        </SelectItem>
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
                        <SelectItem className="rounded-none" value="fintech">
                          Fintech
                        </SelectItem>
                        <SelectItem className="rounded-none" value="healthtech">
                          Healthtech
                        </SelectItem>
                        <SelectItem className="rounded-none" value="edtech">
                          Edtech
                        </SelectItem>
                        <SelectItem className="rounded-none" value="ecommerce">
                          E-commerce
                        </SelectItem>
                        <SelectItem className="rounded-none" value="productivity">
                          Productivity
                        </SelectItem>
                        <SelectItem className="rounded-none" value="social">
                          Social
                        </SelectItem>
                        <SelectItem className="rounded-none" value="entertainment">
                          Entertainment
                        </SelectItem>
                        <SelectItem className="rounded-none" value="developer-tools">
                          Developer Tools
                        </SelectItem>
                        <SelectItem className="rounded-none" value="content-management">
                          Content Management
                        </SelectItem>
                        <SelectItem className="rounded-none" value="analytics">
                          Analytics
                        </SelectItem>
                        <SelectItem className="rounded-none" value="other">
                          Other
                        </SelectItem>
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
                        options={tagsEnum.enumValues.map((tag) => ({
                          label: tag,
                          value: tag,
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

          {currentStep === 3 && (
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
                <Button type="submit" className="rounded-none" disabled={isLoading || success}>
                  {isLoading ? 'Submitting...' : 'Submit Project'}
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
