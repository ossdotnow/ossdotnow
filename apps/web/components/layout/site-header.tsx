import { Button } from '@workspace/ui/components/button';
import Icons from '@/components/icons';
import Link from 'next/link';

const SiteHeader = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-[#101010]">
      <div className="border-border mx-auto flex h-16 max-w-7xl items-center justify-between border-b border-l border-r px-4 sm:px-8">
        <span className="flex items-center gap-4">
          <Icons.logo className="size-8" />
          <span className="text-2xl font-medium">oss.now</span>
        </span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-none">
            <Link href="https://l.oss.now/gh/">
              <Icons.github className="size-5 fill-white" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="rounded-none">
            <Link href="https://l.oss.now/x/">
              <Icons.twitter className="size-5 fill-white" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
