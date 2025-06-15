import { env } from '@workspace/env/server';
import { redirect } from 'next/navigation';

export default async function Layout({ children }: { children: React.ReactNode }) {
  if (env.NODE_ENV === 'production') {
    redirect('/');
  }

  return children;
}
