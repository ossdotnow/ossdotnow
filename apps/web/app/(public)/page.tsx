import { WaitlistForm } from '@/components/waitlist-form';
import { Button } from '@workspace/ui/components/button';
import { Logos } from '@/components/logos';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function Page() {
  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden md:h-[calc(100vh-80px)]">
      <Image
        src="/home-background.png"
        alt=""
        aria-hidden="true"
        width={960}
        height={860}
        className="pointer-events-none absolute left-0 right-0 top-0 z-0 h-full w-full object-cover object-right-bottom opacity-70 mix-blend-screen"
      />

      <div className="relative z-10 mx-auto flex w-full flex-col items-center justify-center gap-8 overflow-hidden text-center">
        <div className="z-10 flex w-full max-w-lg flex-col items-center gap-12">
          <h1 className="z-10 text-4xl font-medium tracking-[-0.04em] sm:text-7xl">
            Open source it, <br /> right now.
          </h1>
          <p className="z-10 mx-auto text-balance text-center text-[#9f9f9f] sm:text-lg">
            A platform for open source project discovery, collaboration, and growth - connecting
            project owners with contributors.{' '}
            <span className="font-medium text-white">Coming soon.</span>
          </p>
          <WaitlistForm />
          <div className="space-y-4">
            <p>We&apos;ve opened early submissions for your project.</p>
            <Button asChild>
              <Link href="/projects" className="flex items-center gap-2 rounded-none">
                <span>Add your project</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        <Logos />
      </div>
    </div>
  );
}
