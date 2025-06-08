'use client';

import { Button } from '@workspace/ui/components/button';
import { authClient } from '@workspace/auth/client';
import { redirect } from 'next/navigation';

type Props = {};

const Profile = (props: Props) => {
  const signOut = async () => {
    await authClient.signOut();
    redirect('/login');
  };
  return (
    <div>
      <span>Profile</span>
      <Button onClick={signOut}>Sign out</Button>
    </div>
  );
};

export default Profile;
