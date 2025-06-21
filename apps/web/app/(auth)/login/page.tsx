import { LoginForm } from '@/components/auth/login-form';
import Icons from '@workspace/ui/components/icons';

export default function Page() {
  return (
    <div className="relative h-svh w-full">
      <div className="absolute top-0 right-0 bottom-0 z-0 flex aspect-square w-full items-center justify-end bg-transparent mix-blend-screen md:w-[1000px]">
        <img
          src="/login-background.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 h-full object-cover object-right opacity-20 mix-blend-screen"
        />
      </div>
      <div className="bottom-0mx-auto absolute top-0 left-0 flex aspect-square h-full w-full max-w-5xl flex-row items-center justify-center gap-8 text-center">
        <div className="flex flex-col items-center justify-center gap-8">
          <Icons.logo className="mb-10 size-20" />
          <LoginForm className="min-w-sm" />
        </div>
      </div>
    </div>
  );
}
