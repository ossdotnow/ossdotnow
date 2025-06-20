import ProjectPage from './project-page';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <ProjectPage id={id} />;
}
