'use client';

import { authClient } from '@workspace/auth/client';
import EditProjectDialog from './edit-project-dialog';

interface EditProjectButtonProps {
  project: {
    id: string;
    ownerId: string | null;
    name: string;
    description: string | null;
    logoUrl?: string | null;
    gitRepoUrl?: string | null;
    gitHost?: string | null;
    status?: string | null;
    type?: string | null;
    tags?: string[] | null;
    socialLinks?: {
      twitter?: string | null;
      discord?: string | null;
      linkedin?: string | null;
      website?: string | null;
    } | null;
    isLookingForContributors?: boolean | null;
    isLookingForInvestors?: boolean | null;
    isHiring?: boolean | null;
    isPublic?: boolean | null;
    hasBeenAcquired?: boolean | null;
  };
}

export default function EditProjectButton({ project }: EditProjectButtonProps) {
  const { data: session } = authClient.useSession();

  // Only show edit button if user is logged in and is the owner of the project
  if (!session?.user?.id || project.ownerId !== session.user.id) {
    return null;
  }

  return (
    <EditProjectDialog
      projectId={project.id}
      initialData={project}
    />
  );
}
