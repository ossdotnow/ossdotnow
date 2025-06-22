import { PoweredByNeon } from '@/components/layout/powered-by-neon';
import { SiteHeader } from '@/components/layout/site-header';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main>
      <SiteHeader />
      {children}
      <PoweredByNeon />
    </main>
  );
}
