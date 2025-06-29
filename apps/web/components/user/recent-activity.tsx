'use client';

import {
  MessageSquare,
  ThumbsUp,
  Rocket,
  CheckCircle2,
  XCircle,
  Code2,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useTRPC } from '@/hooks/use-trpc';
import Link from 'next/link';

type Activity = {
  id: string;
  type: 'project_created' | 'comment' | 'upvote' | 'project_launch' | 'project_claim';
  timestamp: Date;
  title: string;
  description: string | null;
  projectName: string;
  projectId: string;
  projectLogoUrl?: string | null;
  claimSuccess?: boolean;
};

export function RecentActivity({ userId }: { userId: string }) {
  const trpc = useTRPC();
  const { data: activities } = useQuery(trpc.profile.getRecentActivities.queryOptions({ userId }));

  const getActivityIcon = (type: string, claimSuccess?: boolean) => {
    switch (type) {
      case 'project_created':
        return <Code2 className="h-4 w-4 text-blue-500" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'upvote':
        return <ThumbsUp className="h-4 w-4 text-orange-500" />;
      case 'project_launch':
        return <Rocket className="h-4 w-4 text-purple-500" />;
      case 'project_claim':
        return claimSuccess ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        );
      default:
        return <Calendar className="h-4 w-4 text-neutral-500" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'project_created':
        return 'text-blue-500';
      case 'comment':
        return 'text-green-500';
      case 'upvote':
        return 'text-orange-500';
      case 'project_launch':
        return 'text-purple-500';
      case 'project_claim':
        return 'text-emerald-500';
      default:
        return 'text-neutral-500';
    }
  };

  return (
    <Card className="mt-4 rounded-none border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="px-6">
        <div className="space-y-6">
          {activities?.length === 0 ? (
            <p className="text-center text-sm text-neutral-500">No activity yet</p>
          ) : (
            activities?.map((activity: Activity) => (
              <div key={activity.id} className="flex gap-4">
                <div className="mt-1 flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900">
                    {getActivityIcon(activity.type, activity.claimSuccess)}
                  </div>
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white">{activity.title}</p>
                      {activity.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-neutral-400">
                          {activity.description}
                        </p>
                      )}
                    </div>
                    {activity.projectLogoUrl && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={activity.projectLogoUrl} alt={activity.projectName} />
                        <AvatarFallback className="bg-neutral-800 text-xs">
                          {activity.projectName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  <div className="text-xs text-neutral-500">
                    <Link
                      href={`/projects/${activity.projectId}`}
                      className={`font-medium hover:underline ${getActivityColor(activity.type)}`}
                    >
                      {activity.projectName}
                    </Link>{' '}
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
