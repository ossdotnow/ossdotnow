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
    </main>
  );
}
