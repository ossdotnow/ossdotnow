import ProjectPage from './project-page';

export default async function Page({
  params,
}: {
  params: Promise<{ provider: string; org: string; repo: string }>;
}) {
  const { provider, org, repo } = await params;

  return <ProjectPage provider={provider} org={org} repoId={repo} />;
}
