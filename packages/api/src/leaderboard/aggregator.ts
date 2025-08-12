// packages/api/src/leaderboard/aggregator.ts
/**
 * Aggregator (optimized):
 * - Per-day provider fetches → upsert contrib_daily (idempotent)
 * - Recompute contrib_totals once at the end for each provider
 * - Optional concurrency for multi-day ranges
 */

import { and, eq, gte, lt, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import { getGithubContributionTotalsForDay } from "../providers/github";
import { getGitlabContributionTotalsForDay } from "../providers/gitlab";

// Ensure this path matches your db package export
import {
  contribDaily,
  contribTotals,
  contribProvider,
} from "@workspace/db/schema";

/* ------------------------------ Types ------------------------------ */

export type Provider = (typeof contribProvider.enumValues)[number];

export type AggregatorDeps = { db: PostgresJsDatabase };

export type RefreshUserDayArgs = {
  userId: string;
  githubLogin?: string | null;
  gitlabUsername?: string | null;
  dayUtc: Date | string;
  githubToken?: string;
  gitlabToken?: string;
  gitlabBaseUrl?: string;
  /** When true, skip totals recompute (caller will recompute once at the end) */
  skipTotalsRecompute?: boolean;
};

type GithubDayResult = { commits: number; prs: number; issues: number };
type GitlabDayResult = { commits: number; mrs: number; issues: number };
type RefreshResults = { github?: GithubDayResult; gitlab?: GitlabDayResult };

/* ------------------------------ Date helpers ------------------------------ */

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
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/* ------------------------------ DB helpers ------------------------------ */

async function upsertDaily(
  db: PostgresJsDatabase,
  args: { userId: string; provider: Provider; day: Date; commits: number; prs: number; issues: number },
): Promise<void> {
  const dayStr = ymdUTC(args.day);
  await db
    .insert(contribDaily)
    .values({
      userId: args.userId,
      provider: args.provider,
      dateUtc: dayStr,
      commits: args.commits,
      prs: args.prs,
      issues: args.issues,
      updatedAt: sql`now()`,
    })
    .onConflictDoUpdate({
      target: [contribDaily.userId, contribDaily.provider, contribDaily.dateUtc],
      set: {
        commits: args.commits,
        prs: args.prs,
        issues: args.issues,
        updatedAt: sql`now()`,
      },
    });
}

async function sumWindow(
  db: PostgresJsDatabase,
  userId: string,
  provider: Provider,
  fromInclusive: Date,
  toExclusive: Date,
): Promise<number> {
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${contribDaily.commits} + ${contribDaily.prs} + ${contribDaily.issues}), 0)`,
    })
    .from(contribDaily)
    .where(
      and(
        eq(contribDaily.userId, userId),
        eq(contribDaily.provider, provider),
        gte(contribDaily.dateUtc, ymdUTC(fromInclusive)),
        lt(contribDaily.dateUtc, ymdUTC(toExclusive)),
      ),
    );
  return (row?.total ?? 0) as number;
}

async function sumAllTime(db: PostgresJsDatabase, userId: string, provider: Provider): Promise<number> {
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${contribDaily.commits} + ${contribDaily.prs} + ${contribDaily.issues}), 0)`,
    })
    .from(contribDaily)
    .where(and(eq(contribDaily.userId, userId), eq(contribDaily.provider, provider)));
  return (row?.total ?? 0) as number;
}

async function upsertTotals(
  db: PostgresJsDatabase,
  args: { userId: string; provider: Provider; allTime: number; last30d: number; last365d: number },
): Promise<void> {
  await db
    .insert(contribTotals)
    .values({
      userId: args.userId,
      provider: args.provider,
      allTime: args.allTime,
      last30d: args.last30d,
      last365d: args.last365d,
      updatedAt: sql`now()`,
    })
    .onConflictDoUpdate({
      target: [contribTotals.userId, contribTotals.provider],
      set: {
        allTime: args.allTime,
        last30d: args.last30d,
        last365d: args.last365d,
        updatedAt: sql`now()`,
      },
    });
}

async function recomputeProviderTotals(
  db: PostgresJsDatabase,
  userId: string,
  provider: Provider,
  now: Date = new Date(),
): Promise<{ allTime: number; last30d: number; last365d: number }> {
  const today = startOfUtcDay(now);
  const tomorrow = addDaysUTC(today, 1);
  const d30 = addDaysUTC(today, -30);
  const d365 = addDaysUTC(today, -365);

  const [last30d, last365d, allTime] = await Promise.all([
    sumWindow(db, userId, provider, d30, tomorrow),
    sumWindow(db, userId, provider, d365, tomorrow),
    sumAllTime(db, userId, provider),
  ]);

  await upsertTotals(db, { userId, provider, allTime, last30d, last365d });
  return { allTime, last30d, last365d };
}

/* ------------------------------ Public API ------------------------------ */

export async function refreshUserDay(
  deps: AggregatorDeps,
  args: RefreshUserDayArgs,
): Promise<{ day: string; updatedProviders: string[]; results: RefreshResults }> {
  const db = deps.db;
  const day = startOfUtcDay(args.dayUtc);
  const results: RefreshResults = {};

  // GitHub
  if (args.githubLogin && args.githubLogin.trim() && args.githubToken) {
    const gh = await getGithubContributionTotalsForDay(args.githubLogin.trim(), day, args.githubToken);
    results.github = { commits: gh.commits, prs: gh.prs, issues: gh.issues };
    await upsertDaily(db, { userId: args.userId, provider: "github", day, commits: gh.commits, prs: gh.prs, issues: gh.issues });
    if (!args.skipTotalsRecompute) await recomputeProviderTotals(db, args.userId, "github", day);
  }

  // GitLab
  if (args.gitlabUsername && args.gitlabUsername.trim()) {
    const base = args.gitlabBaseUrl?.trim() || "https://gitlab.com";
    const gl = await getGitlabContributionTotalsForDay(args.gitlabUsername.trim(), day, base, args.gitlabToken);
    results.gitlab = { commits: gl.commits, mrs: gl.mrs, issues: gl.issues };
    await upsertDaily(db, { userId: args.userId, provider: "gitlab", day, commits: gl.commits, prs: gl.mrs, issues: gl.issues });
    if (!args.skipTotalsRecompute) await recomputeProviderTotals(db, args.userId, "gitlab", day);
  }

  return { day: ymdUTC(day), updatedProviders: Object.keys(results), results };
}

/** tiny concurrency limiter */
async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const ret: R[] = [];
  let i = 0;
  const workers = Array.from({ length: Math.max(1, limit) }, async () => {
    while (i < items.length) {
      const idx = i++;
      ret[idx] = await fn(items[idx]!);
    }
  });
  await Promise.all(workers);
  return ret;
}

/**
 * Refresh a range of UTC days (inclusive).
 * - Skips per-day recompute; recomputes once at the end for each provider.
 * - `concurrency` controls how many days are processed in parallel (default 4).
 */
export async function refreshUserDayRange(
  deps: AggregatorDeps,
  args: Omit<RefreshUserDayArgs, "dayUtc" | "skipTotalsRecompute"> & {
    fromDayUtc: Date | string;
    toDayUtc: Date | string;
    concurrency?: number;
  },
): Promise<{ daysRefreshed: string[] }> {
  const from = startOfUtcDay(args.fromDayUtc);
  const toInclusive = startOfUtcDay(args.toDayUtc);
  const days: Date[] = [];
  for (let d = new Date(from); d.getTime() <= toInclusive.getTime(); d = addDaysUTC(d, 1)) days.push(new Date(d));

  const daysStr: string[] = [];

  const concurrency = Math.max(1, Math.min(args.concurrency ?? 4, 10)); // be gentle with rate limits

  await mapWithConcurrency(days, concurrency, async (d) => {
    const res = await refreshUserDay(deps, {
      ...args,
      dayUtc: d,
      skipTotalsRecompute: true, // defer recompute to the end
    });
    daysStr.push(res.day);
  });

  // Single recompute at the end (fast)
  if (args.githubLogin && args.githubToken) {
    await recomputeProviderTotals(deps.db, args.userId, "github", new Date());
  }
  if (args.gitlabUsername) {
    await recomputeProviderTotals(deps.db, args.userId, "gitlab", new Date());
  }

  // Sort for pretty output
  daysStr.sort();
  return { daysRefreshed: daysStr };
}
