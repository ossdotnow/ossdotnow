'use client';

import Icons from '@workspace/ui/components/icons';
import { PoweredByNeon } from './powered-by-neon';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const platformLinks = [
  { name: 'Projects', href: '/projects' },
  { name: 'Launches', href: '/launches' },
  { name: 'About', href: '/about' },
  { name: 'Submit Project', href: '/submit' },
];

const communityLinks = [
  { name: 'Discord', href: '#' },
  { name: 'Twitter', href: '#' },
  { name: 'GitHub', href: '#' },
];

const legalLinks = [
  { name: 'Terms of Service', href: '/terms' },
  { name: 'Privacy Policy', href: '/privacy' },
];

export default function Footer() {
  const pathname = usePathname();
  return pathname.includes('login') || pathname.includes('admin') ? null : (
    <footer className="w-full border-t border-gray-800 bg-black text-gray-400">
      <div className="mx-auto max-w-[1080px] px-4 py-8 sm:py-12">
        <div className="mb-8 grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <Icons.logo className="size-6 text-white" />
              <span className="text-lg text-white">oss.now</span>
            </Link>
            <p className="max-w-xs text-sm">
              A platform for open source project discovery, collaboration, and growth.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-white">Platform</h3>
            <ul className="space-y-3">
              {platformLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="transition-colors hover:text-white">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-white">Community</h3>
            <ul className="space-y-3">
              {communityLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-white"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-white">Legal</h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="transition-colors hover:text-white">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-gray-800 pt-8 sm:flex-row">
          <div className="text-center text-sm sm:text-left">
            © {new Date().getFullYear()} oss.now. All rights reserved.
          </div>
          <PoweredByNeon />
        </div>
      </div>
    </footer>
  );
}
