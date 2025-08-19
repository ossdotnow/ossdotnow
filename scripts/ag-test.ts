/**
 * Aggregator test script
 *
 * Usage:
 *   bun scripts/agg-test.ts --user-id 11111111-1111-1111-1111-111111111111 --gh yourGithubLogin --gl yourGitLabUsername --days 30
 *   bun scripts/agg-test.ts --user-id 11111111-1111-1111-1111-111111111111 --gh yourGithubLogin --date 2025-08-10
 */

import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
// @ts-ignore -- Bun supports default import from 'postgres'
import postgres, { type Sql } from 'postgres';

import { refreshUserDay, refreshUserDayRange } from '../packages/api/src/leaderboard/aggregator';
import { contribTotals } from '../packages/db/src/schema/contributions';
import { eq } from 'drizzle-orm';

type Args = {
  userId?: string;
  gh?: string;
  gl?: string;
  days?: number;
  date?: string;
};

function parseArgs(argv: string[]): Args {
  const out: Args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const n = argv[i + 1];
    if (a === '--user-id') ((out.userId = n), i++);
    else if (a === '--gh') ((out.gh = n), i++);
    else if (a === '--gl') ((out.gl = n), i++);
    else if (a === '--days') ((out.days = Number(n)), i++);
    else if (a === '--date') ((out.date = n), i++);
  }
  return out;
}

function startOfUtcDay(d: Date | string): Date {
  const x = d instanceof Date ? new Date(d) : new Date(d);
  return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate(), 0, 0, 0, 0));
}
function addDaysUTC(d: Date, days: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}
function ymdUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

async function makeDb(): Promise<{ db: PostgresJsDatabase; client: Sql<any> }> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Missing DATABASE_URL in env');

  const needsSSL = /neon\.tech/i.test(url) || /sslmode=require/i.test(url);
  const client = postgres(url, needsSSL ? { ssl: 'require' as const } : {});
  const db = drizzle(client);
  return { db, client };
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.userId) {
    args.userId = crypto.randomUUID();
    console.log(`No --user-id provided. Using generated UUID: ${args.userId}`);
  }

  if (!args.gh && !args.gl) {
    console.error('Provide at least one provider username: --gh <githubLogin> or --gl <gitlabUsername>');
    process.exit(1);
  }

  const { db, client } = await makeDb();

  const githubToken = process.env.GITHUB_GRAPHQL_TOKEN || process.env.GITHUB_TOKEN;
  const gitlabToken = process.env.GITLAB_TOKEN;
  const gitlabBaseUrl = process.env.GITLAB_ISSUER || 'https://gitlab.com';

  try {
    if (args.date) {
      const day = startOfUtcDay(args.date);
      console.log(`Refreshing single UTC day: ${ymdUTC(day)} for user ${args.userId}`);
      const res = await refreshUserDay(
        { db },
        {
          userId: args.userId,
          githubLogin: args.gh,
          gitlabUsername: args.gl,
          dayUtc: day,
          githubToken,
          gitlabToken,
          gitlabBaseUrl,
        },
      );
      console.log('Updated providers:', res.updatedProviders);
    } else {
      const days = Math.max(1, Math.min(Number(args.days || 2), 31));
      const today = startOfUtcDay(new Date());
      const from = addDaysUTC(today, -(days - 1));
      console.log(`Refreshing UTC day range ${ymdUTC(from)} → ${ymdUTC(today)} (inclusive), user ${args.userId}`);
      const res = await refreshUserDayRange(
        { db },
        {
          userId: args.userId,
          githubLogin: args.gh,
          gitlabUsername: args.gl,
          fromDayUtc: from,
          toDayUtc: today,
          githubToken,
          gitlabToken,
          gitlabBaseUrl,
        },
      );
      console.log('Days refreshed:', res.daysRefreshed.join(', '));
    }

    const rows = await db
      .select({
        provider: contribTotals.provider,
        allTime: contribTotals.allTime,
        last30d: contribTotals.last30d,
        last365d: contribTotals.last365d,
        updatedAt: contribTotals.updatedAt,
      })
      .from(contribTotals)
      .where(eq(contribTotals.userId, args.userId));

    const combined = rows.reduce(
      (acc, r) => {
        acc.allTime += Number(r.allTime || 0);
        acc.last30d += Number(r.last30d || 0);
        acc.last365d += Number(r.last365d || 0);
        return acc;
      },
      { allTime: 0, last30d: 0, last365d: 0 },
    );

    console.log('\ncontrib_totals (per provider):');
    for (const r of rows) {
      console.log(
        `  ${r.provider}: all=${r.allTime}  30d=${r.last30d}  365d=${r.last365d}  (updated ${r.updatedAt?.toISOString?.() || r.updatedAt})`,
      );
    }
    console.log('\ncombined totals:');
    console.log(`  all=${combined.allTime}  30d=${combined.last30d}  365d=${combined.last365d}`);
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
