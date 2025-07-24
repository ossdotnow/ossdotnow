import { NextSSRPlugin } from '@uploadthing/react/next-ssr-plugin';
import { ourFileRouter } from '@/app/api/uploadthing/core';
import { extractRouterConfig } from 'uploadthing/server';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { Providers } from '@/components/providers';
import { Databuddy } from '@databuddy/sdk';
import { connection } from 'next/server';
import { Toaster } from 'sonner';
import { Suspense } from 'react';
import { Metadata } from 'next';
import { env } from 'process';
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
  title: {
    template: '%s | oss now | early project submissions are live',
    default: 'oss now | early project submissions are live',
  },
  description:
    'A platform for open source project discovery, collaboration, and growth - connecting project owners with contributors.',
  icons: {
    icon: '/icon.svg',
  },
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
          <Databuddy
            clientId={env.DATABUDDY_CLIENT_ID!}
            enableBatching={true}
            trackErrors
            trackOutgoingLinks
            disabled={env.VERCEL_ENV === 'development'}
          />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
