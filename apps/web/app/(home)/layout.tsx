import SiteHeader from '@/components/layout/site-header';
import { Geist, Geist_Mono } from 'next/font/google';
import '@workspace/ui/globals.css';
import { Metadata } from 'next';

const fontSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

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
