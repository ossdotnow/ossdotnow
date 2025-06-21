'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { project, projectApprovalStatusEnum } from '@workspace/db/schema';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import Link from '@workspace/ui/components/link';
import { Check, Eye, X } from 'lucide-react';
import { useTRPC } from '@/hooks/use-trpc';
import { useQueryState } from 'nuqs';

type Project = typeof project.$inferSelect;

export default function AdminProjectsDashboard() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [approvalStatus, setApprovalStatus] = useQueryState('approvalStatus', {
    defaultValue: 'all',
  });

  const {
    data: projects,
    isLoading,
    isError,
  } = useQuery(trpc.projects.getProjects.queryOptions({ approvalStatus: 'all' }));
  const { mutate: acceptProject } = useMutation({
    ...trpc.projects.acceptProject.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.projects.getProjects.queryKey({
          approvalStatus: approvalStatus as Project['approvalStatus'] | 'all',
        }),
      });
    },
  });

  const { mutate: rejectProject } = useMutation({
    ...trpc.projects.rejectProject.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.projects.getProjects.queryKey({
          approvalStatus: approvalStatus as Project['approvalStatus'] | 'all',
        }),
      });
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error</div>;
  if (!projects) return <div>No projects found</div>;

  const handleAccept = (projectId: string) => {
    acceptProject({ projectId });
    queryClient.invalidateQueries({
      queryKey: [...trpc.projects.getProjects.queryKey({ approvalStatus: 'all' })],
    });
  };

  const handleReject = (projectId: string) => {
    rejectProject({ projectId });
    queryClient.invalidateQueries({
      queryKey: [...trpc.projects.getProjects.queryKey({ approvalStatus: 'all' })],
    });
  };

  const tabs = [...projectApprovalStatusEnum.enumValues, 'all'] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage projects</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Accepted</span>
              <span className="text-sm font-medium">
                {projects.filter((project) => project.approvalStatus === 'approved').length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Rejected</span>
              <span className="text-sm font-medium">
                {projects.filter((project) => project.approvalStatus === 'rejected').length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Pending</span>
              <span className="text-sm font-medium">
                {projects.filter((project) => project.approvalStatus === 'pending').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Tabs className="space-y-4" defaultValue={approvalStatus}>
        <TabsList className="bg-muted/30">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="w-28"
              onClick={() => setApprovalStatus(tab)}
            >
              <span className="capitalize">{tab}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            <ProjectsTable
              projects={projects.filter(
                (project) =>
                  project.approvalStatus === (tab as Project['approvalStatus']) || tab === 'all',
              )}
              handleAccept={handleAccept}
              handleReject={handleReject}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function ProjectsTable({
  projects,
  handleAccept,
  handleReject,
}: {
  projects: Project[];
  handleAccept: (projectId: string) => void;
  handleReject: (projectId: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Name</TableHead>
          <TableHead>Repository</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id}>
            <TableCell className="font-medium">{project.name}</TableCell>
            <TableCell>{project.gitRepoUrl}</TableCell>
            <TableCell>
              <Badge
                variant={
                  project.approvalStatus === 'approved'
                    ? 'default'
                    : project.approvalStatus === 'rejected'
                      ? 'destructive'
                      : 'outline'
                }
              >
                {project.approvalStatus}
              </Badge>
            </TableCell>
            <TableCell className="space-x-2 text-right">
              {project.approvalStatus === 'approved' && (
                <Button variant="secondary" asChild>
                  <Link target="_blank" href={`/projects/${project.id}`}>
                    <Eye size={16} />
                    View Project
                  </Link>
                </Button>
              )}
              <Button variant="secondary" asChild>
                <Link
                  target="_blank"
                  href={
                    project.gitHost === 'github'
                      ? `https://github.com/${project.gitRepoUrl}`
                      : `https://gitlab.com/${project.gitRepoUrl}`
                  }
                >
                  <Eye size={16} />
                  View Repo
                </Link>
              </Button>
              {project.approvalStatus === 'pending' || project.approvalStatus !== 'approved' ? (
                <Button
                  variant="default"
                  className="bg-green-500 text-green-800 hover:bg-green-600"
                  onClick={() => handleAccept(project.id)}
                >
                  <Check size={16} />
                  Accept
                </Button>
              ) : null}
              {project.approvalStatus === 'pending' || project.approvalStatus !== 'rejected' ? (
                <Button
                  variant="destructive"
                  className="text-red-200"
                  onClick={() => handleReject(project.id)}
                >
                  <X size={16} />
                  Reject
                </Button>
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
