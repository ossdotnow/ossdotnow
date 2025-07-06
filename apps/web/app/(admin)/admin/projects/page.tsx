'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { project, projectApprovalStatusEnum, projectProviderEnum } from '@workspace/db/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Edit, Eye, Pin, PinOff, XCircle } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Badge } from '@workspace/ui/components/badge';
import Link from '@workspace/ui/components/link';
import NumberFlow from '@number-flow/react';
import { useTRPC } from '@/hooks/use-trpc';
import { useQueryState } from 'nuqs';
import { useState } from 'react';

type Project = typeof project.$inferSelect & {
  status: { id: string; name: string; displayName: string } | null;
  type: { id: string; name: string; displayName: string } | null;
  tagRelations: Array<{
    tag: { id: string; name: string; displayName: string } | null;
  }>;
};

type ApprovalStatusFilter = Project['approvalStatus'] | 'all';

export default function AdminProjectsDashboard() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [approvalStatus, setApprovalStatus] = useQueryState('approvalStatus', {
    defaultValue: 'all',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');

  const {
    data: projects,
    isLoading,
    isError,
  } = useQuery(trpc.projects.getProjects.queryOptions({ approvalStatus: 'all' }));

  // Fetch categories for filters
  const { data: projectStatuses } = useQuery(
    trpc.categories.getProjectStatuses.queryOptions({ activeOnly: true }),
  );
  const { data: projectTypes } = useQuery(
    trpc.categories.getProjectTypes.queryOptions({ activeOnly: true }),
  );
  const { data: tags } = useQuery(trpc.categories.getTags.queryOptions({ activeOnly: true }));

  const { mutate: acceptProject } = useMutation({
    ...trpc.projects.acceptProject.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.projects.getProjects.queryKey({
          approvalStatus: approvalStatus as ApprovalStatusFilter,
        }),
      });
    },
  });

  const { mutate: rejectProject } = useMutation({
    ...trpc.projects.rejectProject.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.projects.getProjects.queryKey({
          approvalStatus: approvalStatus as ApprovalStatusFilter,
        }),
      });
    },
  });

  const { mutate: pinProject } = useMutation({
    ...trpc.projects.pinProject.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.projects.getProjects.queryKey({
          approvalStatus: approvalStatus as ApprovalStatusFilter,
        }),
      });
    },
  });

  const { mutate: unpinProject } = useMutation({
    ...trpc.projects.unpinProject.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.projects.getProjects.queryKey({
          approvalStatus: approvalStatus as ApprovalStatusFilter,
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

  const handlePin = (projectId: string) => {
    pinProject({ projectId });
    queryClient.invalidateQueries({
      queryKey: [...trpc.projects.getProjects.queryKey({ approvalStatus: 'all' })],
    });
  };

  const handleUnpin = (projectId: string) => {
    unpinProject({ projectId });
    queryClient.invalidateQueries({
      queryKey: [...trpc.projects.getProjects.queryKey({ approvalStatus: 'all' })],
    });
  };

  const tabs = [...projectApprovalStatusEnum.enumValues, 'all'] as const;

  const filteredProjects = projects.data
    .filter((project) => approvalStatus === 'all' || project.approvalStatus === approvalStatus)
    .filter((project) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        project.name.toLowerCase().includes(searchLower) ||
        (project.gitRepoUrl?.toLowerCase().includes(searchLower) ?? false)
      );
    })
    .filter((project: Project) => statusFilter === 'all' || project.status?.name === statusFilter)
    .filter((project: Project) => typeFilter === 'all' || project.type?.name === typeFilter)
    .filter((project) => providerFilter === 'all' || project.gitHost === providerFilter)
    .filter(
      (project: Project) =>
        tagFilter === 'all' ||
        project.tagRelations.some((relation) => relation.tag?.name === tagFilter),
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <p className="text-muted-foreground">Review, approve, and manage project submissions</p>
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
            <Card>
              <CardHeader>
                <CardTitle>Project Management</CardTitle>
                <CardDescription>
                  {tab === 'all' ? (
                    <span>
                      Showing all <NumberFlow value={filteredProjects.length} /> projects.
                    </span>
                  ) : (
                    <span>
                      Showing <NumberFlow value={filteredProjects.length} /> {tab} projects.
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Input
                      placeholder="Search projects..."
                      className="w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {projectStatuses?.map((status) => (
                          <SelectItem key={status.id} value={status.name}>
                            {status.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={providerFilter} onValueChange={setProviderFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Providers</SelectItem>
                        {projectProviderEnum.enumValues.map((provider) => (
                          <SelectItem key={provider} value={provider}>
                            {provider}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {projectTypes?.map((type) => (
                          <SelectItem key={type.id} value={type.name}>
                            {type.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={tagFilter} onValueChange={setTagFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tags</SelectItem>
                        {tags?.map((tag) => (
                          <SelectItem key={tag.id} value={tag.name}>
                            {tag.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      disabled={
                        searchQuery === '' &&
                        statusFilter === 'all' &&
                        typeFilter === 'all' &&
                        tagFilter === 'all'
                      }
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('all');
                        setTypeFilter('all');
                        setTagFilter('all');
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <ProjectsTable
                  projects={filteredProjects.filter(
                    (project) =>
                      project.approvalStatus === (tab as ApprovalStatusFilter) || tab === 'all',
                  )}
                  handleAccept={handleAccept}
                  handleReject={handleReject}
                  handlePin={handlePin}
                  handleUnpin={handleUnpin}
                />
              </CardContent>
            </Card>
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
  handlePin,
  handleUnpin,
}: {
  projects: Project[];
  handleAccept: (projectId: string) => void;
  handleReject: (projectId: string) => void;
  handlePin: (projectId: string) => void;
  handleUnpin: (projectId: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project Name</TableHead>
          <TableHead>Claimed</TableHead>
          <TableHead>Repo</TableHead>
          <TableHead>Provider</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Approval</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Tags</TableHead>
          <TableHead>Pinned</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id}>
            <TableCell className="font-medium">{project.name}</TableCell>
            <TableCell>
              <Badge variant="secondary">{(!!project.ownerId)?.toString()}</Badge>
            </TableCell>
            <TableCell>{project.gitRepoUrl || 'N/A'}</TableCell>
            <TableCell>{project.gitHost || 'N/A'}</TableCell>
            <TableCell>
              <p>{project.status?.displayName || 'N/A'}</p>
            </TableCell>
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
            <TableCell>
              <p>{project.type?.displayName || 'N/A'}</p>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {project.tagRelations.slice(0, 3).map((relation, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {relation.tag?.displayName}
                  </Badge>
                ))}
                {project.tagRelations.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{project.tagRelations.length - 3} more
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => (project.isPinned ? handleUnpin(project.id) : handlePin(project.id))}
              >
                {project.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </Button>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end space-x-2">
                <Link href={`/projects/${project.id}`}>
                  <Button size="sm" variant="ghost">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/admin/projects/${project.id}/edit`}>
                  <Button size="sm" variant="ghost">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
                {project.approvalStatus === 'pending' && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => handleAccept(project.id)}>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleReject(project.id)}>
                      <XCircle className="h-4 w-4 text-red-600" />
                    </Button>
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
