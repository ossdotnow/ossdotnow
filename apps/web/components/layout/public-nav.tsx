import Link from '@/components/link';

export default function PublicNav() {
  return (
    <>
      <Link href="/roadmap" event="roadmap_nav_click" className="p-2">
        roadmap
      </Link>
      <Link href="/projects" event="projects_nav_click" className="p-2">
        projects
      </Link>
      <Link href="/about" event="about_nav_click" className="p-2">
        about
      </Link>
    </>
  );
}
