import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
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
          className="pointer-events-none absolute left-0 top-0 z-0 h-full w-full object-cover object-bottom object-right"
        />
        <div className="z-10 flex w-full max-w-lg flex-col items-center gap-12">
          <h1 className="text-4xl font-medium sm:text-7xl">
            Open source it, <br /> right now.
          </h1>
          <p className="mx-auto max-w-sm text-center text-[#9f9f9f]">
            A place to share your open source projects and find new ones. Coming soon.
          </p>
          {/* <div className="flex w-full items-center gap-2">
            <Input className="rounded-none bg-[#2e2e2e] opacity-100 placeholder:text-[#9f9f9f]" />
            <Button variant="default" className="rounded-none">
              Join Waitlist
            </Button>
          </div> */}
        </div>
      </div>
    </div>
  );
}
