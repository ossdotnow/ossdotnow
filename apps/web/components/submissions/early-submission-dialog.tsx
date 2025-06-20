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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@workspace/ui/components/popover';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Textarea } from '@workspace/ui/components/textarea';
import { Progress } from '@workspace/ui/components/progress';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { parseAsBoolean, useQueryState } from 'nuqs';
// import { UploadDropzone } from '@/lib/uploadthing';
import { track } from '@vercel/analytics/react';
import { earlySubmissionForm } from '@/forms';
import { useEffect, useState } from 'react';
import { useTRPC } from '@/hooks/use-trpc';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod/v4';

function useEarlySubmission() {
  const trpc = useTRPC();
  const [isMounted, setIsMounted] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const query = useQuery(trpc.earlySubmission.getEarlySubmissionsCount.queryOptions());

  useEffect(() => {
    setIsMounted(true);
    setSuccess(localStorage.getItem('early-submission-success') === 'true');
  }, []);

  const { mutate, isPending } = useMutation(
    trpc.earlySubmission.addProject.mutationOptions({
      onSuccess: () => {
        setSuccess(true);
        setError(null);
        queryClient.setQueryData([trpc.earlySubmission.getEarlySubmissionsCount.queryKey()], {
          count: (query.data?.count ?? 0) + 1,
        });

        if (isMounted) {
          localStorage.setItem('early-submission-success', 'true');
          localStorage.setItem('early-submission-count', ((query.data?.count ?? 0) + 1).toString());
        }
        toast.success('Project submitted successfully!');
        track('early_submission_success');
      },
      onError: (err) => {
        const errorMessage = err.message || 'Something went wrong. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
        track('early_submission_error', { error: errorMessage });
      },
    }),
  );

  const clearError = () => setError(null);

  return {
    count: query.data?.count ?? 0,
    mutate,
    success,
    error,
    isLoading: isPending,
    clearError,
  };
}

export default function EarlySubmissionDialog() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [tagsRawInput, setTagsRawInput] = useState('');
  const { mutate, success, error, isLoading, clearError } = useEarlySubmission();
  const [isAllowed] = useQueryState('am-i-allowed', parseAsBoolean.withDefault(false));

  type FormData = z.infer<typeof earlySubmissionForm>;

  const form = useForm<FormData>({
    resolver: zodResolver(earlySubmissionForm),
    mode: 'onChange',
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
        github: '',
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
      description: 'Tell us about yourself',
      fields: ['name', 'description', 'logoUrl'] as (keyof FormData)[],
    },
    {
      id: 'repository-information',
      title: 'Repository Information',
      description: 'Where are you located?',
      fields: ['gitRepoUrl', 'gitHost'] as (keyof FormData)[],
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
  ];

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(platform)) {
        newSet.delete(platform);
      } else {
        newSet.add(platform);
      }
      return newSet;
    });
  };

  function handleProjectSubmission(formData: FormData) {
    mutate(formData);
  }

  const nextStep = async () => {
    const currentStepFields = steps[currentStep]?.fields;
    if (!currentStepFields) return;

    let fieldsToValidate = [...currentStepFields];

    if (currentStep === 3) {
      const socialLinkFields = Array.from(selectedPlatforms).map(
        (platform) => `socialLinks.${platform}` as keyof FormData,
      );
      fieldsToValidate = [...fieldsToValidate, ...socialLinkFields];
    }

    const isStepValid = await trigger(fieldsToValidate);

    if (isStepValid) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    } else {
      toast.error('Please fill in all required fields.');
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  if (!isAllowed) return null;

  const submissionCount =
    typeof window !== 'undefined'
      ? parseInt(localStorage.getItem('early-submission-count') ?? '0')
      : 0;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 rounded-none">
          <span>Early Submission</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle>Early Submission</DialogTitle>
          <DialogDescription>Submit your open source project for early access.</DialogDescription>
        </DialogHeader>
        {success ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h3 className="text-xl font-semibold">Submission Successful!</h3>
            <p className="text-muted-foreground text-center">
              Thank you for submitting your project. We&apos;ll review it and get back to you soon.
            </p>
            <p className="text-muted-foreground text-sm">
              Your submission #{submissionCount} in our early submission program.
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
                onSubmit={(e) => {
                  if (currentStep !== steps.length - 1) {
                    e.preventDefault();
                    return;
                  }
                  form.handleSubmit(handleProjectSubmission)(e);
                }}
                className="space-y-6"
              >
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Basic Information</h3>
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
                            The name of your project, preferably match your repository name.
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
                            Provide a clear, concise description of what your project does and its
                            main features. This helps potential contributors and users understand
                            your project at a glance.
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
                    <h3 className="text-sm font-medium">Repository Information</h3>

                    <FormField
                      control={form.control}
                      name="gitRepoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Repository URL (optional)</FormLabel>
                          <FormControl>
                            <Input
                              className="border-border z-10 rounded-none border !bg-[#1D1D1D]/100 text-base placeholder:text-[#9f9f9f]"
                              placeholder="ossdotnow/ossdotnow"
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormDescription>
                            Only provide the username/organisation name and repository name. Format:
                            username/repository
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
                          <Select onValueChange={field.onChange} value={field.value || 'github'}>
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
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Project Details</h3>

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
                            Select the category that best describes your project&apos;s primary
                            focus area.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => {
                        useEffect(() => {
                          setTagsRawInput(field.value?.join(', ') ?? '');
                        }, [field.value]);

                        return (
                          <FormItem>
                            <FormLabel>Project Tags</FormLabel>
                            <FormControl>
                              <Input
                                className="border-border z-10 rounded-none border !bg-[#1D1D1D]/100 text-base placeholder:text-[#9f9f9f]"
                                placeholder="web, mobile, ai (comma-separated)"
                                value={tagsRawInput}
                                onChange={(e) => {
                                  setTagsRawInput(e.target.value);
                                }}
                                onBlur={() => {
                                  const tags = tagsRawInput
                                    .split(',')
                                    .map((tag: string) => tag.trim())
                                    .filter((tag) => tag.length > 0);
                                  field.onChange(tags.length > 0 ? tags : []);
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Add tags to help categorize your project. Separate multiple tags with
                              commas. Available tags: web, mobile, desktop, backend, frontend,
                              fullstack, ai, game, crypto, nft, social, other
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
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

                      <Popover open={isOpen} onOpenChange={setIsOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={isOpen}
                            className="border-border w-full justify-between rounded-none !bg-[#1D1D1D]/100"
                          >
                            {selectedPlatforms.size === 0
                              ? 'Select social platforms...'
                              : `${selectedPlatforms.size} platform${selectedPlatforms.size === 1 ? '' : 's'} selected`}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full rounded-none p-0">
                          <div className="p-2">
                            {socialPlatforms.map((platform) => (
                              <div
                                key={platform.value}
                                className="hover:bg-accent flex cursor-pointer items-center space-x-2 p-2"
                                onClick={() => togglePlatform(platform.value)}
                              >
                                <Checkbox
                                  checked={selectedPlatforms.has(platform.value)}
                                  onCheckedChange={() => togglePlatform(platform.value)}
                                />
                                <label className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                  {platform.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>

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
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Looking for Contributors</FormLabel>
                              <FormDescription>
                                Enable this if you&apos;re actively seeking developers to contribute
                                code, documentation, or other improvements to your project.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isHiring"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
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
                  <div className="flex justify-between gap-4 pt-6">
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
                      <Button
                        type="submit"
                        className="rounded-none"
                        disabled={isLoading || success}
                      >
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
        )}
      </DialogContent>
    </Dialog>
  );
}
