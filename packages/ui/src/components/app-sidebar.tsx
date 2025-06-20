'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@workspace/ui/components/sidebar';
import { FolderOpen, ListChecks, Tags, Users } from 'lucide-react';
import { NavUser } from '@workspace/ui/components/nav-user';
import { NavMain } from '@workspace/ui/components/nav-main';
import Icons from '@workspace/ui/components/icons';

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: {
    id: string;
    name: string;
    emailVerified: boolean;
    email: string;
    createdAt: Date;
    updatedAt: Date;
    image?: string | null | undefined | undefined;
  };
}) {
  const data = {
    navMain: [
      // {
      //   title: 'Dashboard',
      //   url: '/admin',
      //   icon: LayoutDashboard,
      //   isActive: true,
      // },
      {
        title: 'User Management',
        url: '#',
        icon: Users,
        items: [
          {
            title: 'All Users',
            url: '/admin/users',
          },
          // {
          //   title: 'Roles & Permissions',
          //   url: '/admin/users/roles',
          // },
          // {
          //   title: 'User Activity',
          //   url: '/admin/users/activity',
          // },
        ],
      },
      {
        title: 'Projects',
        url: '#',
        icon: FolderOpen,
        items: [
          {
            title: 'All Projects',
            url: '/admin/projects?approvalStatus=all',
          },
          {
            title: 'Project Settings',
            url: '/admin/projects/settings',
            disabled: true,
          },
        ],
      },
      // {
      //   title: 'Categories & Tags',
      //   url: '#',
      //   icon: Tags,
      //   items: [
      //     {
      //       title: 'Project Types',
      //       url: '/admin/categories/types',
      //     },
      //     {
      //       title: 'Tags',
      //       url: '/admin/categories/tags',
      //     },
      //   ],
      // },
      {
        title: 'Waitlist',
        url: '#',
        icon: ListChecks,
        items: [
          {
            title: 'All Users',
            url: '/admin/waitlist',
          },
          // {
          //   title: 'Analytics',
          //   url: '/admin/waitlist/analytics',
          // },
        ],
      },
      // {
      //   title: 'Analytics',
      //   url: '/admin/analytics',
      //   icon: BarChart3,
      // },
      // {
      //   title: 'Security',
      //   url: '/admin/security',
      //   icon: Shield,
      // },
      // {
      //   title: 'Settings',
      //   url: '/admin/settings',
      //   icon: Settings,
      // },
    ],
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2">
          <Icons.logo className="size-6" />
          <span className="text-lg font-medium">oss.now admin</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user.name,
            email: user.email,
            avatar: user.image ?? '',
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
