import { LoginForm } from '@/components/auth/login-form';

export default function Page() {
  return (
    <div className="relative mx-auto h-[calc(100vh-66px)] max-w-[1080px]">
      <div className="absolute top-0 right-0 bottom-0 z-0 flex aspect-square w-full items-center justify-end bg-transparent mix-blend-screen md:w-[1000px]">
        <img
          src="/login-background.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 h-full object-cover object-right opacity-20 mix-blend-screen"
        />
      </div>
      <div className="flex h-full flex-col items-center justify-center gap-8">
        {/* <Icons.logo className="mb-10 size-20" /> */}
        <LoginForm className="min-w-sm" />
      </div>
    </div>
  );
}
