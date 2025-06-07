import { WaitlistForm } from '@/components/waitlist-form';
import Icons from '@/components/icons';
import Image from 'next/image';

export default function Page() {
  return (
    <div className="mt-16 flex h-[calc(100vh-(65px+64px))]">
      <div className="border-border relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col items-center justify-center gap-4 gap-8 border border-b-0 text-center">
        <Image
          src="/home-background.png"
          alt="background"
          width={960}
          height={860}
          className="pointer-events-none absolute left-0 top-0 z-0 h-full w-full object-cover object-bottom object-right mix-blend-screen"
        />
        <div className="z-10 mt-0 flex w-full max-w-lg flex-col items-center gap-12 sm:-mt-16">
          <h1 className="z-10 text-4xl font-medium tracking-[-0.04em] sm:text-7xl">
            Open source it, <br /> right now.
          </h1>
          <p className="z-10 mx-auto max-w-sm text-center text-[#9f9f9f]">
            A place to share your open source projects and find new ones. Coming soon.
          </p>
          <WaitlistForm />
        </div>
        <div className="z-10 mt-20 flex w-full max-w-lg flex-col items-center gap-6">
          <p className="z-10 text-sm font-medium uppercase tracking-wider text-[#494949]">
            Created by the people behind
          </p>
          <div className="z-10 flex items-center gap-8">
            <Icons.zero className="z-10 h-8 w-8 fill-[#494949] sm:h-10 sm:w-10" />
            <Icons.arc className="z-10 h-8 w-8 fill-[#494949] sm:h-10 sm:w-10" />
            <Icons.cupola className="z-10 h-8 w-8 fill-[#494949] sm:h-10 sm:w-10" />
            <Icons.analog className="z-10 h-8 w-8 fill-[#494949] sm:h-10 sm:w-10" />
            <Icons.sword className="z-10 h-8 w-8 fill-[#494949] sm:h-10 sm:w-10" />
          </div>
        </div>
      </div>
    </div>
  );
}
