import { appRouter, createContext } from '@workspace/api';
import type { ContributorData } from '@workspace/api';
import { headers } from 'next/headers';
import AboutPage from './about-page';

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

export default async function Page() {
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
    <main className="px-6">
      <AboutPage contributors={contributors} error={error} />
    </main>
  );
}
