'use client';

import { EditProjectForm } from '@/components/submissions/edit-project-dialog';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useTRPC } from '@/hooks/use-trpc';
import { Loader2 } from 'lucide-react';

export default function Page() {
  const trpc = useTRPC();
  const router = useRouter();
  const params = useParams();

  const projectId = params?.id as string;

  if (!projectId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Invalid URL</h1>
          <p className="text-gray-600">
            Missing project ID in the URL. Please check the link and try again.
          </p>
        </div>
      </div>
    );
  }

  const {
    data: project,
    isLoading,
    error,
  } = useQuery(trpc.projects.getById.queryOptions({ id: projectId }));

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Project Not Found</h1>
          <p className="text-gray-600">We couldn't find a project with the given ID.</p>
        </div>
      </div>
    );
  }

  const initialData = {
    name: project.name,
    description: project.description ?? '',
    gitRepoUrl: project.gitRepoUrl,
    gitHost: project.gitHost as 'github' | 'gitlab' | null,
    status: project.status || '',
    type: project.type || '',
    socialLinks: project.socialLinks || {},
    isLookingForContributors: project.isLookingForContributors || false,
    isHiring: project.isHiring || false,
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Update Repository Information</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Modify your project details including name, description, repository, and social links.
          </p>
        </div>

        <EditProjectForm
          projectId={projectId}
          initialData={initialData}
          onSuccess={() => {
            router.push(`/projects/${projectId}`);
          }}
        />
      </div>
    </div>
  );
}
