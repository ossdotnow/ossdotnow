import { appRouter, createContext } from '@workspace/api';
import type { ContributorData } from '@workspace/api';
import { GitPullRequest, Github } from 'lucide-react';
import Link from '@workspace/ui/components/link';
import { headers } from 'next/headers';

// ISR revalidation - 24 hours since contributors don't change frequently
export const revalidate = 86400; // 24 hours in seconds

async function getContributors(): Promise<ContributorData[]> {
  const ctx = await createContext({ headers: await headers() });
  const caller = appRouter.createCaller(ctx);

  return caller.repository.getContributors({
    url: 'ossdotnow/ossdotnow',
    provider: 'github',
  });
}

export default async function ContributorsPage() {
  const userRoles = { ahmetskilinc: 'Owner', aysahoo: 'Maintainer' };
  const getRole = (username: string) => userRoles[username as keyof typeof userRoles];

  let contributors: ContributorData[] = [];
  let error = false;

  try {
    const allContributors = await getContributors();
    contributors = allContributors.filter((c) => c.username !== 'Zaid-maker');
  } catch (err) {
    console.error('Failed to fetch contributors:', err);
    error = true;
  }

  return (
    <div className="mx-auto mt-6 max-w-[1080px] px-6 py-8">
      <div className="space-y-6 border border-neutral-800 bg-neutral-900/30 p-6">
        <div className="flex items-center justify-center space-x-3">
          <h1 className="text-2xl font-normal text-white">Meet our contributors</h1>
          <Link
            href="https://github.com/ossdotnow/ossdotnow"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-400 transition-colors hover:text-cyan-400"
          >
            <Github className="h-5 w-5" />
          </Link>
        </div>

        {error ? (
          <div className="border border-neutral-700 bg-neutral-800/20 p-6 text-center">
            <p className="text-neutral-400">Failed to load contributors</p>
          </div>
        ) : contributors && contributors.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {contributors.map((contributor: ContributorData) => (
              <Link
                key={contributor.id}
                href={`https://github.com/${contributor.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`group block border bg-neutral-800/20 p-3 transition-all duration-200 hover:bg-neutral-800/40 hover:shadow-lg ${
                  getRole(contributor.username) === 'Owner'
                    ? 'border-yellow-400/30 hover:border-yellow-400/60 hover:shadow-yellow-400/10'
                    : getRole(contributor.username) === 'Maintainer'
                      ? 'border-orange-400/30 hover:border-orange-400/60 hover:shadow-orange-400/10'
                      : 'border-neutral-700 hover:border-cyan-500/50 hover:shadow-cyan-500/10'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={contributor.avatarUrl || `https://github.com/${contributor.username}.png`}
                    alt={`${contributor.username}'s avatar`}
                    className="h-8 w-8 rounded-full border border-neutral-600 transition-all group-hover:border-neutral-500"
                  />
                  <div className="min-w-0 flex-1">
                    <h3
                      className={`truncate text-sm font-medium text-white transition-colors ${
                        getRole(contributor.username) === 'Owner'
                          ? 'group-hover:text-yellow-400'
                          : getRole(contributor.username) === 'Maintainer'
                            ? 'group-hover:text-orange-400'
                            : 'group-hover:text-cyan-400'
                      }`}
                    >
                      @{contributor.username}
                    </h3>
                    <div className="mt-1 flex items-center justify-between">
                      {getRole(contributor.username) ? (
                        <span
                          className={`px-2 py-0.5 text-xs font-medium ${
                            getRole(contributor.username) === 'Owner'
                              ? 'bg-yellow-400/20 text-yellow-400'
                              : 'bg-orange-400/20 text-orange-400'
                          }`}
                        >
                          {getRole(contributor.username)}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">Contributor</span>
                      )}
                      <div className="flex items-center space-x-1 text-xs text-neutral-400">
                        <GitPullRequest className="h-3 w-3" />
                        <span className="font-medium">{contributor.pullRequestsCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="border border-neutral-700 bg-neutral-800/20 p-6 text-center">
            <p className="text-neutral-400">No contributors found</p>
          </div>
        )}

        <div className="mt-8 border-t border-neutral-800 pt-6 text-center">
          <p className="text-neutral-300">
            Thank you to all our amazing contributors who make oss.now possible! ❤️
          </p>
          <p className="mt-2 text-sm text-neutral-400">
            Every contribution, big or small, helps build a better platform for the open source
            community.
          </p>
        </div>
      </div>
    </div>
  );
}
