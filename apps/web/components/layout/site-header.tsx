import { auth } from '@workspace/auth/server';
import { headers } from 'next/headers';
import { NavInner } from './nav-inner';

export async function SiteHeader() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return <NavInner session={session} />;
}
