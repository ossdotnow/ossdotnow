import { project } from '@workspace/db/schema';
import { env } from '@workspace/env/server';
import ProjectPage from './project-page';
import { db } from '@workspace/db';
import { eq } from 'drizzle-orm';
import { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const projectData = await db.select().from(project).where(eq(project.id, id)).limit(1);

    if (!projectData.length) {
      return {
        title: 'Project Not Found',
        description: 'The requested project could not be found.',
      };
    }

    const proj = projectData[0]!;
    const baseUrl = env.VERCEL_URL?.startsWith('http')
      ? env.VERCEL_URL
      : `https://${env.VERCEL_URL}`;

    let ogImageUrl = null;

    if (proj.gitRepoUrl) {
      const provider = proj.gitHost === 'github' ? 'gh' : 'gl';
      const owner = proj.ownerId;
      const repo = proj.name;

      const params = new URLSearchParams();
      if (proj.name !== repo) {
        params.set('name', proj.name);
      }
      if (proj.description) {
        params.set('description', proj.description);
      }

      ogImageUrl = `${baseUrl}/api/og-image/${provider}/${owner}/${repo}${params.toString() ? `?${params.toString()}` : ''}`;
    }

    return {
      title: proj.name,
      description: proj.description || `Check out ${proj.name} on oss.now`,
      openGraph: {
        title: proj.name,
        description: proj.description || `Check out ${proj.name} on oss.now`,
        images: ogImageUrl
          ? [
              {
                url: ogImageUrl,
                width: 1200,
                height: 630,
                alt: `${proj.name} - Open Source Project`,
              },
            ]
          : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: proj.name,
        description: proj.description || `Check out ${proj.name} on oss.now`,
        images: ogImageUrl ? [ogImageUrl] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Project',
      description: 'Open source project details',
    };
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <ProjectPage id={id} />;
}
