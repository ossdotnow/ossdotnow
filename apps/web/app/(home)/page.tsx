import { WaitlistForm } from '@/components/waitlist-form';
import Logos from '@/components/logos';
import Image from 'next/image';

export default function Page() {
  return (
    <div className="mt-16 flex h-[calc(100vh-(65px+64px))]">
      <div className="border-border relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col items-center justify-center gap-8 border border-b-0 text-center">
        <Image
          src="/home-background.png"
          alt="background"
          width={960}
          height={860}
          className="pointer-events-none absolute left-0 top-0 z-0 h-full w-full object-cover object-right-bottom mix-blend-screen"
        />
        <div className="z-10 mt-0 flex w-full max-w-lg flex-col items-center gap-12 sm:-mt-16">
          <h1 className="z-10 text-4xl font-medium tracking-[-0.04em] sm:text-7xl">
            Open source it, <br /> right now.
          </h1>
          <p className="z-10 mx-auto max-w-md text-balance text-center text-[#9f9f9f]">
            A platform for open source project discovery, collaboration, and growth - connecting
            project owners with contributors.{' '}
            <span className="font-medium text-white">Coming soon.</span>
          </p>
          <WaitlistForm />
        </div>
        <Logos />
      </div>
    </div>
  );
}
