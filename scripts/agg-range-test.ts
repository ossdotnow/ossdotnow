#!/usr/bin/env bun
/**
 * Aggregator range smoke test:
 * - Runs refreshUserDayRange with bounded concurrency
 * - Prints contrib_daily counts, contrib_totals snapshot
 * - Publishes to Redis and prints top combined
 *
 * Usage:
 *   bun scripts/agg-range-test.ts --user-id <uuid> --gh <login> --days 14 --concurrency 6
 */

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
// @ts-ignore — Bun supports default import from 'postgres'
import postgres, { type Sql } from "postgres";
import { and, eq, gte, lte, sql } from "drizzle-orm";

import { refreshUserDayRange } from "../packages/api/src/leaderboard/aggregator";
import { syncUserLeaderboards, topCombined } from "../packages/api/src/leaderboard/redis";
import { contribDaily, contribTotals } from "../packages/db/src/schema/contributions";

type Args = {
  userId?: string;
  gh?: string;
  gl?: string;
  days?: number;
  concurrency?: number;
};

function parseArgs(argv: string[]): Args {
  const a: Args = {};
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i], v = argv[i + 1];
    if (k === "--user-id") (a.userId = v, i++);
    else if (k === "--gh") (a.gh = v, i++);
    else if (k === "--gl") (a.gl = v, i++);
    else if (k === "--days") (a.days = Number(v), i++);
    else if (k === "--concurrency") (a.concurrency = Number(v), i++);
  }
  return a;
}

function startOfUtcDay(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0,0,0,0));
}
function addDaysUTC(d: Date, days: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}
function ymd(d: Date) {
  const y = d.getUTCFullYear(), m = String(d.getUTCMonth()+1).padStart(2,"0"), dd = String(d.getUTCDate()).padStart(2,"0");
  return `${y}-${m}-${dd}`;
}

async function makeDb(): Promise<{ db: PostgresJsDatabase; client: Sql<any> }> {
  const url = process.env.DATABASE_URL!;
  const needsSSL = /neon\.tech/i.test(url) || /sslmode=require/i.test(url);
  const client = postgres(url, needsSSL ? { ssl: "require" as const } : {});
  return { db: drizzle(client), client };
}

async function main() {
  const args = parseArgs(process.argv);
  const userId = args.userId || crypto.randomUUID();
  if (!args.gh && !args.gl) {
    console.error("Provide at least one provider: --gh <login> or --gl <username>");
    process.exit(1);
  }
  const days = Math.min(Math.max(args.days ?? 14, 1), 60);
  const concurrency = Math.min(Math.max(args.concurrency ?? 6, 1), 8);

  const { db, client } = await makeDb();
  const today = startOfUtcDay(new Date());
  const from = addDaysUTC(today, -(days - 1));

  console.log(`User ${userId} • window ${ymd(from)} → ${ymd(today)} • conc=${concurrency}`);

  const res = await refreshUserDayRange(
    { db: db as any }, // typed DB
    {
      userId,
      githubLogin: args.gh,
      gitlabUsername: args.gl,
      fromDayUtc: from,
      toDayUtc: today,
      githubToken: process.env.GITHUB_GRAPHQL_TOKEN || process.env.GITHUB_TOKEN,
      gitlabToken: process.env.GITLAB_TOKEN,
      gitlabBaseUrl: process.env.GITLAB_ISSUER || "https://gitlab.com",
      concurrency,
    },
  );
  console.log("Days refreshed:", res.daysRefreshed.length);

  // contrib_daily rows in window (per provider)
  const [ghDaily] = await db.select({
    n: sql<number>`count(*)`,
  }).from(contribDaily).where(
    and(
      eq(contribDaily.userId, userId),
      eq(contribDaily.provider, "github" as any),
      gte(contribDaily.dateUtc, ymd(from)),
      lte(contribDaily.dateUtc, ymd(today)),
    ),
  );
  const [glDaily] = await db.select({
    n: sql<number>`count(*)`,
  }).from(contribDaily).where(
    and(
      eq(contribDaily.userId, userId),
      eq(contribDaily.provider, "gitlab" as any),
      gte(contribDaily.dateUtc, ymd(from)),
      lte(contribDaily.dateUtc, ymd(today)),
    ),
  );
  console.log(`contrib_daily: github=${Number(ghDaily?.n||0)} gitlab=${Number(glDaily?.n||0)} (expect ~${days} per active provider)`);

  // contrib_totals snapshot
  const totals = await db.select({
    provider: contribTotals.provider,
    all: contribTotals.allTime,
    d30: contribTotals.last30d,
    d365: contribTotals.last365d,
    updatedAt: contribTotals.updatedAt,
  }).from(contribTotals).where(eq(contribTotals.userId, userId));
  console.log("contrib_totals:", totals);

  // publish to Redis & show top
  await syncUserLeaderboards(db as any, userId);
  const top = await topCombined(10, "30d");
  console.log("topCombined(10, 30d):", top);

  await client.end({ timeout: 5 });
}

main().catch((e) => { console.error(e); process.exit(1); });
