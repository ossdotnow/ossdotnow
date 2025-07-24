'use client';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { UseFormReturn } from 'react-hook-form';
import { EditProjectFormData } from './project-edit-form';

interface ProjectSocialLinksProps {
  form: UseFormReturn<EditProjectFormData>;
}

export function ProjectSocialLinks({ form }: ProjectSocialLinksProps) {
  return (
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
  );
}
