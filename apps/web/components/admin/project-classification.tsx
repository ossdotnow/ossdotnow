'use client';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { MultiSelect } from '@workspace/ui/components/multi-select';
import { Badge } from '@workspace/ui/components/badge';
import { projectApprovalStatusEnum } from '@workspace/db/schema';
import { UseFormReturn } from 'react-hook-form';

interface ProjectClassificationProps {
  form: UseFormReturn<any>;
  projectStatuses: Array<{ id: string; name: string; displayName: string }> | undefined;
  projectTypes: Array<{ id: string; name: string; displayName: string }> | undefined;
  tags: Array<{ name: string; displayName: string }> | undefined;
  projectStatusesLoading: boolean;
  projectTypesLoading: boolean;
  tagsLoading: boolean;
}

export function ProjectClassification({
  form,
  projectStatuses,
  projectTypes,
  tags,
  projectStatusesLoading,
  projectTypesLoading,
  tagsLoading,
}: ProjectClassificationProps) {
  return (
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
  );
}
