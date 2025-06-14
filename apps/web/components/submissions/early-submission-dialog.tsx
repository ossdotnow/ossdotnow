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
import { Popover, PopoverContent, PopoverTrigger } from '@workspace/ui/components/popover';
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Textarea } from '@workspace/ui/components/textarea';
import { Progress } from '@workspace/ui/components/progress';
import { Checkbox } from '@workspace/ui/components/checkbox';
// import { earlySubmissionForm } from '@workspace/web/forms';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { UploadDropzone } from '@/lib/uploadthing';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { z } from 'zod';

export default function EarlySubmissionDialog() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const projectSubmissionFormSchema = z.object({
    name: z.string().min(1, 'Project name is required'),
    description: z.string().min(1, 'Description is required'),
    logoUrl: z.string().url().optional().or(z.literal('')),

    gitRepoUrl: z.string().url().optional().or(z.literal('')),
    gitHost: z.enum(['github', 'gitlab']).optional(),

    status: z.enum([
      'active',
      'inactive',
      'early-stage',
      'beta',
      'production-ready',
      'experimental',
      'cancelled',
      'paused',
    ]),
    type: z.enum([
      'fintech',
      'healthtech',
      'edtech',
      'ecommerce',
      'productivity',
      'social',
      'entertainment',
      'developer-tools',
      'content-management',
      'analytics',
      'other',
    ]),

    socialLinks: z
      .object({
        twitter: z.string().url().optional().or(z.literal('')),
        github: z.string().url().optional().or(z.literal('')),
        linkedin: z.string().url().optional().or(z.literal('')),
        website: z.string().url().optional().or(z.literal('')),
      })
      .optional(),

    tags: z.string().optional(),

    isLookingForContributors: z.boolean(),
    isLookingForInvestors: z.boolean(),
    isHiring: z.boolean(),
    isPublic: z.boolean(),
    hasBeenAcquired: z.boolean(),
  });

  const form = useForm<z.infer<typeof projectSubmissionFormSchema>>({
    resolver: zodResolver(projectSubmissionFormSchema),
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
      tags: '',
      isLookingForContributors: false,
      isLookingForInvestors: false,
      isHiring: false,
      isPublic: true,
      hasBeenAcquired: false,
    },
  });

  const { trigger } = form;

  type FormData = z.infer<typeof projectSubmissionFormSchema>;

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
      fields: ['socialLinks', 'isLookingForContributors', 'isHiring'] as (keyof FormData)[],
    },
  ];

  const socialPlatforms = [
    { value: 'website', label: 'Website', placeholder: 'https://example.com' },
    { value: 'twitter', label: 'Twitter', placeholder: 'https://twitter.com/username' },
    { value: 'github', label: 'GitHub', placeholder: 'https://github.com/username' },
    { value: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' },
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

  function handleProjectSubmission(formData: z.infer<typeof projectSubmissionFormSchema>) {
    console.log(formData);
  }

  const nextStep = async () => {
    const currentStepFields = steps[currentStep]?.fields;
    if (!currentStepFields) return;
    const isStepValid = await trigger(currentStepFields);

    if (isStepValid) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

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
        <Progress value={progress} className="w-full" />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleProjectSubmission)} className="space-y-6">
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
                          className="border-border z-10 rounded-none border !bg-[#1D1D1D]/100 text-base placeholder:text-[#9f9f9f]"
                          placeholder="Describe your project..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col gap-2">
                  <FormLabel>Logo</FormLabel>
                  <UploadDropzone
                    endpoint="imageUploader"
                    onClientUploadComplete={(res) => {
                      console.log('Files: ', res);
                      console.log('Upload Completed');
                    }}
                    onUploadError={(error: Error) => {
                      console.error(`ERROR! ${error.message}`);
                    }}
                  />
                </div>
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
                          placeholder="https://github.com/username/repo"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gitHost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Git Host</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-border z-10 w-full rounded-none border !bg-[#1D1D1D]/100 text-base">
                            <SelectValue placeholder="Select project status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-none">
                          <SelectItem className="rounded-none" value="active">
                            Active
                          </SelectItem>
                          <SelectItem className="rounded-none" value="inactive">
                            Inactive
                          </SelectItem>
                          <SelectItem className="rounded-none" value="early-stage">
                            Early Stage
                          </SelectItem>
                          <SelectItem value="beta">Beta</SelectItem>
                          <SelectItem value="production-ready">Production Ready</SelectItem>
                          <SelectItem value="experimental">Experimental</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          <SelectItem value="ecommerce">E-commerce</SelectItem>
                          <SelectItem value="productivity">Productivity</SelectItem>
                          <SelectItem value="social">Social</SelectItem>
                          <SelectItem value="entertainment">Entertainment</SelectItem>
                          <SelectItem value="developer-tools">Developer Tools</SelectItem>
                          <SelectItem value="content-management">Content Management</SelectItem>
                          <SelectItem value="analytics">Analytics</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
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
                        <Input
                          className="border-border z-10 rounded-none border !bg-[#1D1D1D]/100 text-base placeholder:text-[#9f9f9f]"
                          placeholder="web, mobile, ai (comma-separated)"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Available tags: web, mobile, desktop, backend, frontend, fullstack, ai,
                        game, crypto, nft, social, other
                      </FormDescription>
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

                  <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger asChild>
                      <Button
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
                            name={`socialLinks.${platform.value}` as keyof FormData['socialLinks']}
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
                            Let others know you&apos;re open to contributions
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
                          <FormDescription>Show that you have open positions</FormDescription>
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
                  <Button type="submit" className="rounded-none">
                    Submit Project
                  </Button>
                ) : (
                  <Button type="button" onClick={nextStep} className="rounded-none">
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
