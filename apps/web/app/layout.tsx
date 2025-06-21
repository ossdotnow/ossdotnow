import { NextSSRPlugin } from '@uploadthing/react/next-ssr-plugin';
import { ourFileRouter } from '@/app/api/uploadthing/core';
import { extractRouterConfig } from 'uploadthing/server';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { Providers } from '@/components/providers';
import { connection } from 'next/server';
import { Toaster } from 'sonner';
import { Suspense } from 'react';
import { Metadata } from 'next';
import './globals.css';

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

async function UTSSR() {
  await connection();
  return <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} overscroll-none bg-[#101010] font-sans antialiased`}
      >
        <Suspense>
          <UTSSR />
        </Suspense>
        <Providers>
          {children}
          <Analytics />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
