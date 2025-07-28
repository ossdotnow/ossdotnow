import { project } from '@workspace/db/schema';
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

    const proj = projectData[0]!; // We know this exists because we checked length above
    const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL?.startsWith('http')
      ? process.env.NEXT_PUBLIC_VERCEL_URL
      : `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;

    // Extract owner and repo from git URL for OG image
    let ogImageUrl = null;
    if (proj.gitRepoUrl) {
      const urlMatch = proj.gitRepoUrl.match(
        /(?:github\.com|gitlab\.com)\/([^/]+)\/([^/]+?)(?:\.git)?$/,
      );
      if (urlMatch) {
        const [, owner, repo] = urlMatch;
        const provider = proj.gitRepoUrl.includes('gitlab.com') ? 'gl' : 'gh';

        const params = new URLSearchParams();
        if (proj.name !== repo) {
          params.set('name', proj.name);
        }
        if (proj.description) {
          params.set('description', proj.description);
        }

        ogImageUrl = `${baseUrl}/api/og-image/${provider}/${owner}/${repo}${params.toString() ? `?${params.toString()}` : ''}`;
      }
    }

    return {
      title: proj.name,
      description: proj.description || `Check out ${proj.name} on OSS.now`,
      openGraph: {
        title: proj.name,
        description: proj.description || `Check out ${proj.name} on OSS.now`,
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
        description: proj.description || `Check out ${proj.name} on OSS.now`,
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
