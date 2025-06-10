import { Button } from '@workspace/ui/components/button';
import Icons from '@/components/icons';
import Link from '@/components/link';

export function TempNav() {
  return (
    <div className="flex items-center gap-2">
      <Link href="/roadmap" event="roadmap_nav_click" className="mr-2">
        roadmap
      </Link>
      <Button variant="ghost" size="icon" className="rounded-none" asChild>
        <Link
          href="https://l.oss.now/gh/"
          target="_blank"
          rel="noopener noreferrer"
          event="github_nav_click"
        >
          <Icons.github className="size-5 fill-white" />
        </Link>
      </Button>
      <Button variant="ghost" size="icon" className="rounded-none" asChild>
        <Link
          href="https://l.oss.now/x/"
          target="_blank"
          rel="noopener noreferrer"
          event="twitter_nav_click"
        >
          <Icons.twitter className="size-5 fill-white" />
        </Link>
      </Button>
    </div>
  );
}

export default TempNav;
