'use client';

import {
  categoryProjectStatuses,
  categoryProjectTypes,
  categoryTags,
  project,
  projectApprovalStatusEnum,
} from '@workspace/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { ArrowUpDown, CheckCircle, Edit, Eye, Pin, PinOff, XCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/admin/projects-data-table';
import { Button } from '@workspace/ui/components/button';
import { parseAsStringEnum, useQueryState } from 'nuqs';
import { Badge } from '@workspace/ui/components/badge';
import Link from '@workspace/ui/components/link';
import { cn } from '@workspace/ui/lib/utils';
import { useTRPC } from '@/hooks/use-trpc';

type Project = typeof project.$inferSelect & {
  status: typeof categoryProjectStatuses.$inferSelect | null;
  type: typeof categoryProjectTypes.$inferSelect | null;
  tagRelations: Array<{
    tag: typeof categoryTags.$inferSelect | null;
  }>;
};

const approvalStatusTabs = [...projectApprovalStatusEnum.enumValues, 'all'] as const;
const approvalStatusParser = parseAsStringEnum([...approvalStatusTabs]).withDefault('all');

export default function AdminProjectsDashboard() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [approvalStatus, setApprovalStatus] = useQueryState('approvalStatus', approvalStatusParser);

  const {
    data: projectsData,
    isLoading,
    isError,
  } = useQuery(trpc.projects.getProjectsAdmin.queryOptions({}));

  const { mutate: acceptProject } = useMutation({
    ...trpc.projects.acceptProject.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.projects.getProjectsAdmin.queryKey({}),
      });
    },
  });

  const { mutate: rejectProject } = useMutation({
    ...trpc.projects.rejectProject.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.projects.getProjectsAdmin.queryKey({}),
      });
    },
  });

  const { mutate: pinProject } = useMutation({
    ...trpc.projects.pinProject.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.projects.getProjectsAdmin.queryKey({}),
      });
    },
  });

  const { mutate: unpinProject } = useMutation({
    ...trpc.projects.unpinProject.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.projects.getProjectsAdmin.queryKey({}),
      });
    },
  });

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <p className="text-muted-foreground">Review, approve, and manage project submissions</p>
      </div>
      {/*
      <Tabs
        className="space-y-4"
        value={approvalStatus}
        onValueChange={(value) => {
          setApprovalStatus(value as typeof approvalStatus);
        }}
      >
        <TabsList className="bg-muted/30">
          {approvalStatusTabs.map((tab) => (
            <TabsTrigger key={tab} value={tab} className="w-28">
              <span className="capitalize">{tab}</span>
            </TabsTrigger>
          ))}
        </TabsList> */}

      {/* {approvalStatusTabs.map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4"> */}
      <Card>
        <CardHeader>
          <CardTitle>Projects Management</CardTitle>
        </CardHeader>
        <CardContent>
          {projectsData && projectsData.length > 0 ? (
            <ProjectsTable
              projects={projectsData}
              handleAccept={handleAccept}
              handleReject={handleReject}
              handlePin={handlePin}
              handleUnpin={handleUnpin}
            />
          ) : isLoading ? (
            <div>Loading...</div>
          ) : isError ? (
            <div>Error</div>
          ) : (
            <div>No projects found</div>
          )}
        </CardContent>
      </Card>
      {/* </TabsContent>
        ))}
      </Tabs> */}
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
    <DataTable
      columns={[
        {
          accessorKey: 'name',
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              >
                Project Name
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            );
          },
          cell: ({ row }) => {
            return (
              <Link className="font-medium" href={`/projects/${row.original.id}`}>
                {row.original.name}
              </Link>
            );
          },
        },
        {
          accessorFn: (row) => !!row.ownerId,
          header: 'Owner',
          cell: ({ row }) => {
            return (
              <Badge
                variant="default"
                className={cn(
                  row.original.ownerId ? 'bg-green-600 text-green-200' : 'bg-red-600 text-red-200',
                  'capitalize',
                )}
              >
                {row.original.ownerId ? 'Yes' : 'No'}
              </Badge>
            );
          },
        },
        {
          accessorKey: 'gitRepoUrl',
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              >
                Repo
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            );
          },
          cell: ({ row }) => {
            return row.original.gitRepoUrl;
          },
        },
        {
          accessorKey: 'gitHost',
          header: 'Provider',
          filterFn: (row, columnId, filterValue) => {
            if (filterValue === 'all') return true;
            return row.original.gitHost === filterValue;
          },
          cell: ({ row }) => {
            return row.original.gitHost;
          },
        },
        {
          id: 'status',
          accessorKey: 'status.displayName',
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              >
                Status
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            );
          },
          filterFn: (row, columnId, filterValue) => {
            if (filterValue === 'all') return true;
            return row.original.status?.name === filterValue;
          },
          cell: ({ row }) => {
            return row.original.status?.displayName;
          },
        },
        {
          id: 'approvalStatus',
          accessorKey: 'approvalStatus',
          header: 'Approval',
          cell: ({ row }) => {
            return (
              <Badge
                variant="default"
                className={cn(
                  row.original.approvalStatus === 'approved' && 'bg-green-500',
                  row.original.approvalStatus === 'rejected' && 'bg-red-500',
                  row.original.approvalStatus === 'pending' && 'bg-yellow-500',
                )}
              >
                {row.original.approvalStatus}
              </Badge>
            );
          },
        },
        {
          id: 'type',
          accessorKey: 'type.displayName',
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              >
                Type
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            );
          },
          filterFn: (row, columnId, filterValue) => {
            if (filterValue === 'all') return true;
            return row.original.type?.name === filterValue;
          },
          cell: ({ row }) => {
            return row.original.type?.displayName;
          },
        },
        {
          id: 'actions',
          cell: ({ row }) => {
            return (
              <div className="flex items-center justify-end space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    row.original.isPinned
                      ? handleUnpin(row.original.id)
                      : handlePin(row.original.id)
                  }
                >
                  {row.original.isPinned ? (
                    <PinOff className="h-4 w-4" />
                  ) : (
                    <Pin className="h-4 w-4" />
                  )}
                </Button>
                <Link href={`/projects/${row.original.id}`}>
                  <Button size="sm" variant="ghost">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/admin/projects/${row.original.id}/edit`}>
                  <Button size="sm" variant="ghost">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
                {row.original.approvalStatus === 'pending' && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => handleAccept(row.original.id)}>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleReject(row.original.id)}>
                      <XCircle className="h-4 w-4 text-red-600" />
                    </Button>
                  </>
                )}
              </div>
            );
          },
        },
      ]}
      data={projects}
    />
  );
}
