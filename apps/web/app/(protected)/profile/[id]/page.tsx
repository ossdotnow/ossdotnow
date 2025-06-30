import { notFound, redirect } from 'next/navigation';
import { authClient } from '@workspace/auth/client';
import Profile from '@/components/user/profile';
import { env } from '@workspace/env/server';

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  if (env.VERCEL_ENV === 'production') {
    notFound();
  }
  const { id } = await params;
  if (id === 'me') {
    const session = await authClient.getSession();
    if (!session) {
      redirect('/login');
    }
  }

  return <Profile id={id} />;
}
