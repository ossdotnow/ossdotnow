import Profile from '@/components/user/profile';

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <Profile id={id} />;
}
