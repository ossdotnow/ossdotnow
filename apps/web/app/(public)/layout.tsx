import { PoweredByNeon } from '@/components/layout/powered-by-neon';
import { SiteHeader } from '@/components/layout/site-header';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'oss.now | Coming soon',
  description: 'A place to share your open source projects and find new ones. Coming soon.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="px-6">
      <SiteHeader />
      {children}
      <PoweredByNeon />
    </main>
  );
}
