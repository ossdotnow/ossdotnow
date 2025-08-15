'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Bell, Calendar, MessageSquare, CheckCheck } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { useNotifications } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { cn } from '@workspace/ui/lib/utils';
import { useState } from 'react';

interface NotificationItemProps {
  notification: {
    id: string;
    type: 'launch_scheduled' | 'launch_live' | 'comment_received';
    title: string;
    message: string;
    read: boolean;
    createdAt: Date;
    data?: {
      projectId?: string;
      commentId?: string;
      launchId?: string;
      [key: string]: any;
    } | null;
  };
  onMarkAsRead: (id: string) => void;
}

function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const router = useRouter();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'launch_scheduled':
      case 'launch_live':
        return <Calendar className="h-4 w-4 text-blue-400" />;
      case 'comment_received':
        return <MessageSquare className="h-4 w-4 text-green-400" />;
      default:
        return <Bell className="h-4 w-4 text-yellow-400" />;
    }
  };

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.data?.projectId) {
      if (notification.type === 'comment_received') {
        router.push(`/projects/${notification.data.projectId}#comments`);
      } else {
        router.push(`/projects/${notification.data.projectId}`);
      }
    }
  };

  const timeAgo = formatDistanceToNow(notification.createdAt, { addSuffix: false });
  const displayTime = timeAgo.includes('less than') ? 'now' : timeAgo;

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 hover:bg-neutral-800/50 cursor-pointer border-b border-neutral-800 last:border-b-0 rounded-none',
        !notification.read && 'bg-neutral-800/30'
      )}
    >
      {/* Icon */}
      {getNotificationIcon(notification.type)}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className={cn(
              'text-sm leading-5 mb-1',
              !notification.read ? 'text-white font-medium' : 'text-neutral-300'
            )}>
              {notification.title}
            </p>
            <p className="text-sm text-neutral-400 leading-5">
              {notification.message}
            </p>
          </div>

          {/* Time and unread indicator */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-neutral-500">
              {displayTime}
            </span>
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationsDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  if (isLoading) {
    return null;
  }

  const displayNotifications = activeTab === 'all' ? notifications : notifications.filter(n => !n.read);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative rounded-none border-0 p-2 text-sm text-neutral-400 hover:bg-neutral-900 hover:text-white focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          title={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
        >
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-xs text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 sm:w-96 rounded-none border-neutral-800 bg-neutral-900"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        {/* Header */}
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              <p className="text-sm text-neutral-400 mt-1">
                You're all caught up on what's new.
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={markAllAsRead}
                className="gap-2 rounded-none"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all as read
              </Button>
            )}
          </div>

          {/* Tab Buttons */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('all')}
              className={cn(
                "rounded-none px-4",
                activeTab === 'all' && "border border-neutral-600"
              )}
            >
              All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('unread')}
              className={cn(
                "rounded-none px-4",
                activeTab === 'unread' && "border border-neutral-600"
              )}
            >
              Unread
            </Button>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto scrollbar-hide">
          {displayNotifications.length > 0 ? (
            displayNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
              />
            ))
          ) : (
            <div className="px-3 py-6 text-center">
              <Bell className="mx-auto mb-2 h-8 w-8 text-neutral-600" />
              <p className="text-sm text-neutral-400">
                {activeTab === 'all' ? 'No notifications yet' : 'No unread notifications'}
              </p>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
