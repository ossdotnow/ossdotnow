'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog';
import { track as trackVercel } from '@vercel/analytics/react';
import { Button } from '@workspace/ui/components/button';
import { track as trackDatabuddy } from '@databuddy/sdk';
import { useQuery } from '@tanstack/react-query';
import SubmissionForm from './submission-form';
import { Edit, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTRPC } from '@/hooks/use-trpc';
import { toast } from 'sonner';

interface EditProjectDialogProps {
  projectId: string;
  projectName?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export type FormData = {
  name: string;
  description: string;
  logoUrl: string;
  gitRepoUrl: string;
  gitHost: 'github' | 'gitlab';
  status: string;
  type: string;
  socialLinks: {
    twitter: string;
    discord: string;
    linkedin: string;
    website: string;
  };
  tags: string[];
  isLookingForContributors: boolean;
  isLookingForInvestors: boolean;
  isHiring: boolean;
  isPublic: boolean;
  hasBeenAcquired: boolean;
};

export default function EditProjectDialog({
  projectId,
  projectName,
  children,
  variant = 'outline',
  size = 'sm',
}: EditProjectDialogProps) {
  const [open, setOpen] = useState(false);

  const [initialData, setInitialData] = useState<FormData | null>(null);
  const trpc = useTRPC();

  // Fetch project data when dialog opens
  const {
    data: projectData,
    isLoading,
    error,
  } = useQuery(trpc.projects.getById.queryOptions({ id: projectId }, { enabled: open }));

  useEffect(() => {
    if (projectData && open) {
      // Transform the project data to match the form structure
      const formData = {
        name: projectData.name || '',
        description: projectData.description || '',
        logoUrl: projectData.logoUrl || '',
        gitRepoUrl: projectData.gitRepoUrl || '',
        gitHost: projectData.gitHost || 'github',
        status: projectData.status || '',
        type: projectData.type || '',
        socialLinks: {
          twitter: projectData.socialLinks?.twitter || '',
          discord: projectData.socialLinks?.discord || '',
          linkedin: projectData.socialLinks?.linkedin || '',
          website: projectData.socialLinks?.website || '',
        },
        tags: projectData.tags || [],
        isLookingForContributors: projectData.isLookingForContributors || false,
        isLookingForInvestors: projectData.isLookingForInvestors || false,
        isHiring: projectData.isHiring || false,
        isPublic: projectData.isPublic !== false, // Default to true
        hasBeenAcquired: projectData.hasBeenAcquired || false,
      };

      setInitialData(formData);
    }
  }, [projectData, open]);

  const handleSuccess = () => {
    toast.success('Project updated successfully!');
    setOpen(false);
    // Reset initial data so it fetches fresh data next time
    setInitialData(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset initial data when closing
      setInitialData(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button
            onClick={() => {
              trackDatabuddy('edit_project_click', { projectId });
              trackVercel('edit_project_click', { projectId });
            }}
            variant={variant}
            size={size}
            className="cursor-pointer rounded-none"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update your project information for {projectName || 'this project'}.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading project data...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8 text-red-500">
            <p>Error loading project data. Please try again.</p>
          </div>
        ) : initialData ? (
          <SubmissionForm
            isEditing={true}
            projectId={projectId}
            initialData={initialData}
            onSuccess={handleSuccess}
          />
        ) : (
          <div className="flex items-center justify-center py-8">
            <p>No project data found.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
