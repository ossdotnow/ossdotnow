import { notFound, redirect } from 'next/navigation';
import { Profile } from '@/components/user/profile';
import { authClient } from '@workspace/auth/client';
import { env } from '@workspace/env/server';

export default async function ProfilePage() {
  if (env.NODE_ENV === 'production') {
    notFound();
  }

  const session = await authClient.getSession();
  if (!session) {
    redirect('/login');
  }
  return <Profile />;
}
