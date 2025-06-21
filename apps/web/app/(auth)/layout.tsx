import { SiteHeader } from '@/components/layout/site-header';
import { auth } from '@workspace/auth/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user.id) {
    redirect('/');
  }

  return (
    <main className="px-6">
      <SiteHeader />
      {children}
    </main>
  );
}
