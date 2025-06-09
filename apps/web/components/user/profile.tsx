'use client';

import { Button } from '@workspace/ui/components/button';
import { authClient } from '@workspace/auth/client';
import { redirect } from 'next/navigation';

export function Profile() {
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
}
