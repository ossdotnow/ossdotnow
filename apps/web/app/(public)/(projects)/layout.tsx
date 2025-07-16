import { env } from '@workspace/env/server';
import { notFound } from 'next/navigation';

export default async function Layout({ children }: { children: React.ReactNode }) {
  if (env.VERCEL_ENV === 'production') {
    notFound();
  }

  return children;
}
