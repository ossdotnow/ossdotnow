import Link from '@/components/link';

export default function PublicNav() {
  return (
    <div className="mr-2 flex items-center gap-2 text-sm">
      <Link href="/roadmap" event="roadmap_nav_click" className="p-2">
        roadmap
      </Link>
      <Link href="/projects" event="projects_nav_click" className="p-2">
        projects
      </Link>
      <Link href="/about" event="about_nav_click" className="p-2">
        about
      </Link>
    </div>
  );
}
