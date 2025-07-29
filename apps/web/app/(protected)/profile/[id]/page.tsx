import { authClient } from '@workspace/auth/client';
import Profile from '@/components/user/profile';
import { redirect } from 'next/navigation';

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id === 'me') {
    const session = await authClient.getSession();
    if (!session) {
      redirect('/login');
    }
  }

  return <Profile id={id} />;
}
