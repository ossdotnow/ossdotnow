import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from '@workspace/ui/components/breadcrumb';
import { SidebarInset, SidebarProvider } from '@workspace/ui/components/sidebar';
import { AppSidebar } from '@workspace/ui/components/app-sidebar';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@workspace/auth/server';
import { env } from '@workspace/env/server';
import { headers } from 'next/headers';

export default async function Layout({ children }: { children: React.ReactNode }) {
  if (env.NODE_ENV === 'production') {
    notFound();
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const { user } = session ?? {};

  if (!user) {
    redirect('/login');
  }

  const isAdmin = user.role === 'admin';

  if (!isAdmin) {
    notFound();
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/admin">Admin Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
