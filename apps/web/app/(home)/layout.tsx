import { SiteHeader } from '@/components/layout/site-header';
import '@workspace/ui/globals.css';
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
    <>
      <SiteHeader />
      {children}
    </>
  );
}
