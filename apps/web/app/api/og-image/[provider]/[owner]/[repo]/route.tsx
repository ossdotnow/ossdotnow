import { env } from '@workspace/env/server';
import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string; owner: string; repo: string }> },
) {
  try {
    const { provider, owner, repo } = await params;
    const { searchParams } = new URL(request.url);
    const projectName = searchParams.get('name');
    const description = searchParams.get('description');

    if (provider !== 'gh' && provider !== 'gl') {
      return new Response('Invalid provider. Use "gh" for GitHub or "gl" for GitLab', {
        status: 400,
      });
    }

    if (!owner || !repo) {
      return new Response('Missing owner or repo parameter', { status: 400 });
    }

    let repoData: {
      name: string;
      description: string;
      stargazers_count: number;
      forks_count: number;
      open_issues_count: number;
      owner: {
        login: string;
        avatar_url: string;
      };
    };
    let contributorCount = 0;

    if (provider === 'gl') {
      const projectPath = `${owner}/${repo}`;
      const response = await fetch(
        `https://gitlab.com/api/v4/projects/${encodeURIComponent(projectPath)}`,
        {
          headers: {
            'User-Agent': 'ossdotnow',
            ...(env.GITLAB_TOKEN && {
              Authorization: `Bearer ${env.GITLAB_TOKEN}`,
            }),
          },
        },
      );

      if (!response.ok) {
        throw new Error(`GitLab API Error: ${response.status} ${response.statusText}`);
      }

      const gitlabData = await response.json();
      const avatarUrl = gitlabData.namespace?.avatar_url;
      const absoluteAvatarUrl = avatarUrl
        ? avatarUrl.startsWith('http')
          ? avatarUrl
          : `https://gitlab.com${avatarUrl}`
        : `https://gitlab.com/${owner}.png?size=160`;

      repoData = {
        name: gitlabData.name,
        description: gitlabData.description,
        stargazers_count: gitlabData.star_count || 0,
        forks_count: gitlabData.forks_count || 0,
        open_issues_count: gitlabData.open_issues_count || 0,
        owner: {
          login: gitlabData.namespace?.name || owner,
          avatar_url: absoluteAvatarUrl,
        },
      };

      try {
        const contributorsResponse = await fetch(
          `https://gitlab.com/api/v4/projects/${encodeURIComponent(projectPath)}/repository/contributors?per_page=100`,
          {
            headers: {
              'User-Agent': 'ossdotnow',
              ...(env.GITLAB_TOKEN && {
                Authorization: `Bearer ${env.GITLAB_TOKEN}`,
              }),
            },
          },
        );

        if (contributorsResponse.ok) {
          const contributors = await contributorsResponse.json();
          contributorCount = contributors.length;
        }
      } catch {
        contributorCount = 0;
      }
    } else {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'ossdotnow',
          ...(env.GITHUB_TOKEN && { Authorization: `Bearer ${env.GITHUB_TOKEN}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
      }

      repoData = await response.json();
      try {
        const contributorsResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=100`,
          {
            headers: {
              Accept: 'application/vnd.github+json',
              'User-Agent': 'ossdotnow',
              ...(env.GITHUB_TOKEN && {
                Authorization: `Bearer ${env.GITHUB_TOKEN}`,
              }),
            },
          },
        );

        if (contributorsResponse.ok) {
          const contributors = await contributorsResponse.json();
          contributorCount = contributors.length;
        }
      } catch {
        contributorCount = 0;
      }
    }

    const displayName = projectName || repoData.name;
    const displayDescription = description || repoData.description || '';

    const formatNumber = (num: number): string => {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
      }
      return num.toString();
    };

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            backgroundImage: `url(${env.VERCEL_ENV === 'production' ? 'https://' : 'http://'}${env.VERCEL_PROJECT_PRODUCTION_URL}/p-og-2.png)`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            fontFamily: 'Geist, system-ui, sans-serif',
            position: 'relative',
            display: 'flex',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
            }}
          >
            <img
              src={repoData.owner.avatar_url}
              alt={`${repoData.owner.login} avatar`}
              width="160"
              height="160"
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(repoData.owner.login)}&size=160`;
              }}
              style={{
                position: 'absolute',
                top: '80px',
                left: '80px',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '280px',
                left: '80px',
                fontSize: '36px',
                fontWeight: 'normal',
                color: '#E5E5E5',
                lineHeight: '1.1',
                display: 'flex',
              }}
            >
              {owner}/{displayName}
            </div>
            <div
              style={{
                position: 'absolute',
                top: '350px',
                left: '80px',
                fontSize: '32px',
                color: '#D0D0D0',
                lineHeight: '1.4',
                maxWidth: '500px',
                display: 'flex',
              }}
            >
              {displayDescription.length > 80
                ? `${displayDescription.substring(0, 80)}...`
                : displayDescription}
            </div>
            <div
              style={{
                position: 'absolute',
                top: '60px',
                right: '90px',
                width: '460px',
                height: '360px',
                display: 'flex',
                flexDirection: 'column',
                gap: '40px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '70px',
                }}
              >
                <div
                  style={{
                    width: '220px',
                    height: '170px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '56px',
                    fontWeight: 'bold',
                    color: '#00D4AA',
                  }}
                >
                  {formatNumber(repoData.stargazers_count)}
                </div>
                <div
                  style={{
                    width: '220px',
                    height: '170px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '56px',
                    fontWeight: 'bold',
                    color: '#00D4AA',
                  }}
                >
                  {formatNumber(repoData.forks_count)}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '70px',
                }}
              >
                <div
                  style={{
                    width: '220px',
                    height: '170px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '56px',
                    fontWeight: 'bold',
                    color: '#00D4AA',
                  }}
                >
                  {formatNumber(contributorCount)}
                </div>
                <div
                  style={{
                    width: '220px',
                    height: '170px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '56px',
                    fontWeight: 'bold',
                    color: '#00D4AA',
                  }}
                >
                  {formatNumber(repoData.open_issues_count)}
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
        },
      },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(`Failed to generate OG image: ${errorMessage}`, { status: 500 });
  }
}
