import Link from '@/components/link';

export default function PublicNav() {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Link href="/projects" event="projects_nav_click" className="p-2">
        Projects
      </Link>
      <Link href="/about" event="about_nav_click" className="p-2">
        About
      </Link>
    </div>
  );
}
