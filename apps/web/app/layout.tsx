import SiteHeader from '@/components/layout/site-header';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { Providers } from '@/components/providers';
import '@workspace/ui/globals.css';

const fontSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} overscroll-none bg-[#111111] px-2 font-sans antialiased`}
      >
        <Providers>
          <SiteHeader />
          {children}
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
