import { SiteHeader } from '@/components/layout/site-header';
import { auth } from '@workspace/auth/server';
import { env } from '@workspace/env/client';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function Layout({ children }: { children: React.ReactNode }) {
  // TODO: Remove this once we have a production environment
  if (env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
    redirect('/');
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.id) {
    redirect('/');
  }

  return (
    <main>
      <SiteHeader />
      {children}
    </main>
  );
}
