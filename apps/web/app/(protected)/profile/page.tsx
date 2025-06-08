import { Profile } from '@/components/user/profile';
import { authClient } from '@workspace/auth/client';
import { env } from '@workspace/env/server';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  if (env.NODE_ENV === 'production') {
    redirect('/');
  }

  const session = await authClient.getSession();
  if (!session) {
    redirect('/login');
  }
  return <Profile />;
}
