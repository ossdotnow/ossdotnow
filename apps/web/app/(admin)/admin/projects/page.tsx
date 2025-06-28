'use client';

import {
  project,
  projectApprovalStatusEnum,
  projectProviderEnum,
  projectStatusEnum,
  projectTypeEnum,
  tagsEnum,
} from '@workspace/db/schema';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Edit, Eye, XCircle } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Badge } from '@workspace/ui/components/badge';
import Link from '@workspace/ui/components/link';
import NumberFlow from '@number-flow/react';
import { useTRPC } from '@/hooks/use-trpc';
import { useQueryState } from 'nuqs';
import { useState } from 'react';

type Project = typeof project.$inferSelect;

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

  const filteredProjects = projects.data
    .filter((project) => approvalStatus === 'all' || project.approvalStatus === approvalStatus)
    .filter((project) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        project.name.toLowerCase().includes(searchLower) ||
        (project.gitRepoUrl?.toLowerCase().includes(searchLower) ?? false)
      );
    })
    .filter((project) => statusFilter === 'all' || project.status === statusFilter)
    .filter((project) => typeFilter === 'all' || project.type === typeFilter)
    .filter((project) => providerFilter === 'all' || project.gitHost === providerFilter)
    .filter((project) => tagFilter === 'all' || project.tags?.includes(tagFilter as any));

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
                        {projectStatusEnum.enumValues.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
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
                        {projectTypeEnum.enumValues.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
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
                        {tagsEnum.enumValues.map((tag) => (
                          <SelectItem key={tag} value={tag}>
                            {tag}
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
                      project.approvalStatus === (tab as Project['approvalStatus']) ||
                      tab === 'all',
                  )}
                  handleAccept={handleAccept}
                  handleReject={handleReject}
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
}: {
  projects: Project[];
  handleAccept: (projectId: string) => void;
  handleReject: (projectId: string) => void;
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
              <p>{project.status}</p>
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
                className={
                  project.approvalStatus === 'approved'
                    ? 'bg-green-500'
                    : project.approvalStatus === 'pending'
                      ? 'bg-orange-500'
                      : ''
                }
              >
                {project.approvalStatus}
              </Badge>
            </TableCell>
            <TableCell>{project.type}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                {project.approvalStatus === 'pending' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-600"
                      onClick={() => handleAccept(project.id)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() => handleReject(project.id)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {project.approvalStatus === 'approved' && (
                  <Button variant="secondary" size="sm" asChild>
                    <Link target="_blank" href={`/projects/${project.id}`}>
                      <Eye className="mr-1 h-4 w-4" />
                      View
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
