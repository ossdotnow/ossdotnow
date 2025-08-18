import { sql, eq, desc } from "drizzle-orm";
import type { DB } from "@workspace/db";
import { redis } from "../redis/client";
import { contribTotals } from "@workspace/db/schema";

export type WindowKey = "all" | "30d" | "365d";
export type ProviderSel = "combined" | "github" | "gitlab";

const COMBINED_KEYS = {
  all: "lb:total:all",
  "30d": "lb:total:30d",
  "365d": "lb:total:365d",
} as const;

const PROVIDER_KEYS = {
  github: {
    all: "lb:github:all",
    "30d": "lb:github:30d",
    "365d": "lb:github:365d",
  },
  gitlab: {
    all: "lb:gitlab:all",
    "30d": "lb:gitlab:30d",
    "365d": "lb:gitlab:365d",
  },
} as const;

type ZRangeItemObj = { member: string; score: number | string };
type LeaderRow = { userId: string; score: number };

function keyFor(provider: ProviderSel, window: WindowKey): string {
  if (provider === "combined") return COMBINED_KEYS[window];
  return PROVIDER_KEYS[provider][window];
}

function parseZRange(res: unknown): LeaderRow[] {
  if (Array.isArray(res) && res.length && typeof res[0] === "object" && res[0] && "member" in (res[0])) {
    return (res as ZRangeItemObj[]).map(({ member, score }) => ({
      userId: String(member),
      score: typeof score === "string" ? Number(score) : Number(score ?? 0),
    }));
  }
  if (Array.isArray(res)) {
    const out: LeaderRow[] = [];
    for (let i = 0; i < res.length; i += 2) {
      out.push({ userId: String(res[i] ?? ""), score: Number(res[i + 1] ?? 0) });
    }
    return out;
  }
  return [];
}

async function topFromRedis(provider: ProviderSel, window: WindowKey, start: number, stop: number): Promise<LeaderRow[]> {
  const key = keyFor(provider, window);
  const res = await redis.zrange(key, start, stop, { rev: true, withScores: true });
  return parseZRange(res);
}


async function topFromDb(db: DB, provider: ProviderSel, window: WindowKey, limit: number, offset: number): Promise<LeaderRow[]> {
  const col = window === "all" ? contribTotals.allTime
            : window === "30d" ? contribTotals.last30d
            : contribTotals.last365d;

  if (provider === "combined") {
    const rows = await db
      .select({
        userId: contribTotals.userId,
        score: sql<number>`SUM(${col})`.as("score"),
      })
      .from(contribTotals)
      .groupBy(contribTotals.userId)
      .orderBy(desc(sql`SUM(${col})`))
      .limit(limit)
      .offset(offset);

    return rows.map(r => ({ userId: r.userId, score: Number(r.score || 0) }));
  }

  const rows = await db
    .select({
      userId: contribTotals.userId,
      score: col,
    })
    .from(contribTotals)
    .where(eq(contribTotals.provider, provider))
    .orderBy(desc(col))
    .limit(limit)
    .offset(offset);

  return rows.map(r => ({ userId: r.userId, score: Number(r.score || 0) }));
}

export async function getLeaderboardPage(
  db: DB,
  opts: {
    provider: ProviderSel;
    window: WindowKey;
    limit: number;
    cursor?: number;
  },
): Promise<{ entries: LeaderRow[]; nextCursor: number | null; source: "redis" | "db" }> {
  const limit = Math.min(Math.max(opts.limit, 1), 100);
  const start = Math.max(opts.cursor ?? 0, 0);
  const stop = start + limit - 1;

  const fromRedis = await topFromRedis(opts.provider, opts.window, start, stop);
  if (fromRedis.length > 0) {
    const next = fromRedis.length === limit ? start + limit : null;
    return { entries: fromRedis, nextCursor: next, source: "redis" };
  }

  const fromDb = await topFromDb(db, opts.provider, opts.window, limit, start);
  const next = fromDb.length === limit ? start + limit : null;
  return { entries: fromDb, nextCursor: next, source: "db" };
}
