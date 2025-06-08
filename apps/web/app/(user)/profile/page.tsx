import { authClient } from '@workspace/auth/client';
import Profile from '@/components/user/profile';
import { env } from '@workspace/env/server';
import { redirect } from 'next/navigation';

const ProfilePage = async () => {
  if (env.NODE_ENV === 'production') {
    redirect('/');
  }

  const session = await authClient.getSession();
  if (!session) {
    redirect('/login');
  }
  return <Profile />;
};

export default ProfilePage;
