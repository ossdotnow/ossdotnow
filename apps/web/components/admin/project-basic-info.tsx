'use client';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Textarea } from '@workspace/ui/components/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { projectProviderEnum } from '@workspace/db/schema';
import { UseFormReturn } from 'react-hook-form';
import { EditProjectFormData } from './project-edit-form';

interface ProjectBasicInfoProps {
  form: UseFormReturn<EditProjectFormData>;
  repoValidation: {
    isValidating: boolean;
    isValid: boolean | null;
    message: string | null;
  };
  projectData: {
    isRepoPrivate: boolean;
  };
  parseRepositoryUrl: (input: string) => { repo: string; host: string } | null;
  handleRepoChange: (repoUrl: string, gitHost: 'github' | 'gitlab') => void;
}

export function ProjectBasicInfo({
  form,
  repoValidation,
  projectData,
  parseRepositoryUrl,
  handleRepoChange,
}: ProjectBasicInfoProps) {
  // Helper function to handle repository URL parsing and changes
  const handleRepositoryInput = (inputValue: string) => {
    const parsed = parseRepositoryUrl(inputValue);
    if (parsed) {
      handleRepoChange(parsed.repo, parsed.host as 'github' | 'gitlab');
    } else {
      const gitHost = form.getValues('gitHost') || 'github';
      handleRepoChange(inputValue, gitHost as 'github' | 'gitlab');
    }
  };
  return (
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
                      handleRepositoryInput(inputValue);
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
                          handleRepositoryInput(inputValue);
                        }, 0);
                        return;
                      }

                      if (pastedText) {
                        handleRepositoryInput(pastedText);
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
  );
}
