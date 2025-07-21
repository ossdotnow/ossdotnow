'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authClient } from '@workspace/auth/client';
import { use, useEffect, useState } from 'react';
import { useTRPC } from '@/hooks/use-trpc';
import { toast } from 'sonner';
import LaunchHeader from './components/launch-header';
import LaunchSidebar from './components/launch-sidebar';
import LaunchComments from './components/launch-comments';

export default function LaunchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const { data: session } = authClient.useSession();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [showShadow, setShowShadow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowShadow(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch launch details
  const { data: launch, isLoading: launchLoading } = useQuery(
    trpc.launches.getLaunchByProjectId.queryOptions({ projectId }),
  );

  // Fetch project details
  const { data: project } = useQuery(trpc.projects.getProject.queryOptions({ id: projectId }));

  // Fetch comments
  const { data: comments, isLoading: commentsLoading } = useQuery(
    trpc.launches.getComments.queryOptions({ projectId }),
  );

  // Vote mutation
  const voteMutation = useMutation({
    ...trpc.launches.voteProject.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.launches.getLaunchByProjectId.queryKey({ projectId }),
      });
    },
    onError: () => {
      toast.error('Failed to vote. Please try again.');
    },
  });

  const reportMutation = useMutation({
    ...trpc.launches.reportProject.mutationOptions(),
    onSuccess: () => {
      toast.success('Project reported successfully.');
    },
    onError: () => {
      toast.error('Failed to report project. Please try again.');
    },
  });

  if (launchLoading || !launch) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="py-12 text-center">
          <p className="text-neutral-400">Loading launch details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 px-6 md:mt-8">
      <div
        className={`pointer-events-none fixed top-[calc(32px+65px)] z-10 h-10 w-full bg-gradient-to-b from-[#101010] to-transparent transition-all duration-300 ${
          showShadow ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div className="fixed top-0 right-0 left-0 z-10 h-[32px] bg-[#101010]" />
      <div className="mx-auto max-w-[1080px] py-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-4 overflow-hidden lg:col-span-2">
            {/* Main Launch Content */}
            <LaunchHeader launch={launch} project={project} projectId={projectId} />

            {/* About Section */}
            {(launch.detailedDescription || launch.description) && (
              <div className="border border-neutral-800 bg-neutral-900/50 p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">About</h2>
                <p className="text-neutral-400">{launch.detailedDescription || launch.description}</p>
              </div>
            )}

            {/* Comments Section */}
            <LaunchComments
              launch={launch}
              projectId={projectId}
              comments={comments || []}
              commentsLoading={commentsLoading}
            />
          </div>

          {/* Sidebar */}
          <LaunchSidebar
            launch={launch}
            project={project}
            projectId={projectId}
            comments={comments || []}
          />
        </div>
      </div>
    </div>
  );
}
