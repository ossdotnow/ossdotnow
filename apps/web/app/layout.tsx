import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { Providers } from '@/components/providers';
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
        <Providers>
          <main className="px-6">{children}</main>
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
