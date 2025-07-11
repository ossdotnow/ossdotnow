'use client';

import {
  categoryProjectStatuses,
  categoryProjectTypes,
  categoryTags,
  project,
  projectApprovalStatusEnum,
  projectProviderEnum,
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
  CheckCircle,
  Edit,
  Eye,
  Pin,
  PinOff,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { parseAsStringEnum, parseAsInteger, useQueryState } from 'nuqs';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Badge } from '@workspace/ui/components/badge';
import Link from '@workspace/ui/components/link';
import NumberFlow from '@number-flow/react';
import { useTRPC } from '@/hooks/use-trpc';
import { useState } from 'react';

type Project = typeof project.$inferSelect & {
  status: typeof categoryProjectStatuses.$inferSelect | null;
  type: typeof categoryProjectTypes.$inferSelect | null;
  tagRelations: Array<{
    tag: typeof categoryTags.$inferSelect | null;
  }>;
};

const approvalStatusTabs = [...projectApprovalStatusEnum.enumValues, 'all'] as const;
const approvalStatusParser = parseAsStringEnum([...approvalStatusTabs]).withDefault('all');
const pageParser = parseAsInteger.withDefault(1);

export default function AdminProjectsDashboard() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [approvalStatus, setApprovalStatus] = useQueryState('approvalStatus', approvalStatusParser);
  const [page, setPage] = useQueryState('page', pageParser);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const pageSize = 20;

  const {
    data: projectsData,
    isLoading,
    isError,
  } = useQuery(
    trpc.projects.getProjects.queryOptions({
      approvalStatus,
      page,
      pageSize,
      searchQuery: searchQuery || undefined,
      statusFilter: statusFilter === 'all' ? undefined : statusFilter,
      typeFilter: typeFilter === 'all' ? undefined : typeFilter,
      tagFilter: tagFilter === 'all' ? undefined : tagFilter,
      providerFilter: providerFilter === 'all' ? undefined : providerFilter,
    }),
  );

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
          approvalStatus,
          page,
          pageSize,
          searchQuery: searchQuery || undefined,
          statusFilter: statusFilter === 'all' ? undefined : statusFilter,
          typeFilter: typeFilter === 'all' ? undefined : typeFilter,
          tagFilter: tagFilter === 'all' ? undefined : tagFilter,
          providerFilter: providerFilter === 'all' ? undefined : providerFilter,
        }),
      });
    },
  });

  const { mutate: rejectProject } = useMutation({
    ...trpc.projects.rejectProject.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.projects.getProjects.queryKey({
          approvalStatus,
          page,
          pageSize,
          searchQuery: searchQuery || undefined,
          statusFilter: statusFilter === 'all' ? undefined : statusFilter,
          typeFilter: typeFilter === 'all' ? undefined : typeFilter,
          tagFilter: tagFilter === 'all' ? undefined : tagFilter,
          providerFilter: providerFilter === 'all' ? undefined : providerFilter,
        }),
      });
    },
  });

  const { mutate: pinProject } = useMutation({
    ...trpc.projects.pinProject.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.projects.getProjects.queryKey({
          approvalStatus,
          page,
          pageSize,
          searchQuery: searchQuery || undefined,
          statusFilter: statusFilter === 'all' ? undefined : statusFilter,
          typeFilter: typeFilter === 'all' ? undefined : typeFilter,
          tagFilter: tagFilter === 'all' ? undefined : tagFilter,
          providerFilter: providerFilter === 'all' ? undefined : providerFilter,
        }),
      });
    },
  });

  const { mutate: unpinProject } = useMutation({
    ...trpc.projects.unpinProject.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.projects.getProjects.queryKey({
          approvalStatus,
          page,
          pageSize,
          searchQuery: searchQuery || undefined,
          statusFilter: statusFilter === 'all' ? undefined : statusFilter,
          typeFilter: typeFilter === 'all' ? undefined : typeFilter,
          tagFilter: tagFilter === 'all' ? undefined : tagFilter,
          providerFilter: providerFilter === 'all' ? undefined : providerFilter,
        }),
      });
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error</div>;
  if (!projectsData) return <div>No projects found</div>;

  const { data: projects, pagination } = projectsData;

  const handleAccept = (projectId: string) => {
    acceptProject({ projectId });
  };

  const handleReject = (projectId: string) => {
    rejectProject({ projectId });
  };

  const handlePin = (projectId: string) => {
    pinProject({ projectId });
  };

  const handleUnpin = (projectId: string) => {
    unpinProject({ projectId });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tabs = approvalStatusTabs;

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
              onClick={() => {
                setApprovalStatus(tab);
                setPage(1);
              }}
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
                      Showing <NumberFlow value={projects.length} /> of{' '}
                      <NumberFlow value={pagination.totalCount} /> projects.
                    </span>
                  ) : (
                    <span>
                      Showing <NumberFlow value={projects.length} /> of{' '}
                      <NumberFlow value={pagination.totalCount} /> {tab} projects.
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Input
                      placeholder="Search all projects..."
                      className="w-64"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(1);
                      }}
                    />
                    <Select
                      value={statusFilter}
                      onValueChange={(value) => {
                        setStatusFilter(value);
                        setPage(1);
                      }}
                    >
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
                    <Select
                      value={providerFilter}
                      onValueChange={(value) => {
                        setProviderFilter(value);
                        setPage(1);
                      }}
                    >
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
                    <Select
                      value={typeFilter}
                      onValueChange={(value) => {
                        setTypeFilter(value);
                        setPage(1);
                      }}
                    >
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
                    <Select
                      value={tagFilter}
                      onValueChange={(value) => {
                        setTagFilter(value);
                        setPage(1);
                      }}
                    >
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
                        tagFilter === 'all' &&
                        providerFilter === 'all'
                      }
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('all');
                        setTypeFilter('all');
                        setTagFilter('all');
                        setProviderFilter('all');
                        setPage(1);
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <ProjectsTable
                  projects={projects}
                  handleAccept={handleAccept}
                  handleReject={handleReject}
                  handlePin={handlePin}
                  handleUnpin={handleUnpin}
                />

                <div className="mt-6 flex items-center justify-between">
                  <div className="text-muted-foreground text-sm">
                    Page {pagination.page} of {pagination.totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPreviousPage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNumber;
                        if (pagination.totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNumber = i + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNumber = pagination.totalPages - 4 + i;
                        } else {
                          pageNumber = pagination.page - 2 + i;
                        }

                        return (
                          <Button
                            key={i}
                            variant={pagination.page === pageNumber ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePageChange(pageNumber)}
                            className="w-10"
                          >
                            {pageNumber}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNextPage}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
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
