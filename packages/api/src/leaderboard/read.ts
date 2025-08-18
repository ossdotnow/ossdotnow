import { contribTotals } from '@workspace/db/schema';
import { sql, eq, desc } from 'drizzle-orm';
import { redis } from '../redis/client';
import type { DB } from '@workspace/db';

export type WindowKey = 'all' | '30d' | '365d';
export type ProviderSel = 'combined' | 'github' | 'gitlab';

const COMBINED_KEYS = {
  all: 'lb:total:all',
  '30d': 'lb:total:30d',
  '365d': 'lb:total:365d',
} as const;

const PROVIDER_KEYS = {
  github: {
    all: 'lb:github:all',
    '30d': 'lb:github:30d',
    '365d': 'lb:github:365d',
  },
  gitlab: {
    all: 'lb:gitlab:all',
    '30d': 'lb:gitlab:30d',
    '365d': 'lb:gitlab:365d',
  },
} as const;

type ZRangeItemObj = { member?: unknown; score?: unknown };
export type LeaderRow = { userId: string; score: number };

function keyFor(provider: ProviderSel, window: WindowKey): string {
  if (provider === 'combined') return COMBINED_KEYS[window];
  return PROVIDER_KEYS[provider][window];
}

/** Robustly parse Upstash zrange results (supports object form and [member,score,...] form). */
function parseZRange(res: unknown): LeaderRow[] {
  if (!res) return [];

  // Upstash JS SDK commonly returns [{ member, score }, ...]
  if (Array.isArray(res) && res.length > 0 && typeof res[0] === 'object' && res[0] !== null) {
    return (res as ZRangeItemObj[]).flatMap((x) => {
      const id = typeof x.member === 'string' ? x.member : String(x.member ?? '');
      const n = Number(x.score ?? 0);
      return id ? [{ userId: id, score: Number.isFinite(n) ? n : 0 }] : [];
    });
  }

  // Some clients can return a flat tuple list: [member, score, member, score, ...]
  if (Array.isArray(res)) {
    const out: LeaderRow[] = [];
    for (let i = 0; i < res.length; i += 2) {
      const id = String(res[i] ?? '');
      const n = Number(res[i + 1] ?? 0);
      if (id) out.push({ userId: id, score: Number.isFinite(n) ? n : 0 });
    }
    return out;
  }

  return [];
}

/** Read a page from Redis; swallow errors to allow DB fallback. */
async function topFromRedis(
  provider: ProviderSel,
  window: WindowKey,
  start: number,
  stop: number,
): Promise<LeaderRow[]> {
  try {
    const key = keyFor(provider, window);
    const res = await redis.zrange(key, start, stop, { rev: true, withScores: true });
    return parseZRange(res);
  } catch (err) {
    // Do not fail the request if Redis is unavailable; let DB handle it.

    console.error('Redis error in topFromRedis:', err);
    return [];
  }
}

async function topFromDb(
  db: DB,
  provider: ProviderSel,
  window: WindowKey,
  limit: number,
  offset: number,
): Promise<LeaderRow[]> {
  const col =
    window === 'all'
      ? contribTotals.allTime
      : window === '30d'
        ? contribTotals.last30d
        : contribTotals.last365d;

  if (provider === 'combined') {
    const sumExpr = sql<number>`SUM(${col})`;
    const rows = await db
      .select({
        userId: contribTotals.userId,
        score: sumExpr.as('score'),
      })
      .from(contribTotals)
      .groupBy(contribTotals.userId)
      .orderBy(desc(sumExpr))
      .limit(limit)
      .offset(offset);

    return rows.map((r) => ({ userId: r.userId, score: Number(r.score ?? 0) }));
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

  return rows.map((r) => ({ userId: r.userId, score: Number(r.score ?? 0) }));
}

export async function getLeaderboardPage(
  db: DB,
  opts: {
    provider: ProviderSel;
    window: WindowKey;
    limit: number;
    cursor?: number;
  },
): Promise<{ entries: LeaderRow[]; nextCursor: number | null; source: 'redis' | 'db' }> {
  const limit = Math.min(Math.max(opts.limit, 1), 100);
  const start = Math.max(opts.cursor ?? 0, 0);
  const stop = start + limit - 1;

  // 1) Try Redis first; if it fails or empty, fallback below.
  const fromRedis = await topFromRedis(opts.provider, opts.window, start, stop);
  if (fromRedis.length > 0) {
    const nextCursor = fromRedis.length === limit ? start + limit : null;
    return { entries: fromRedis, nextCursor, source: 'redis' };
  }

  // 2) Fallback to DB
  const fromDb = await topFromDb(db, opts.provider, opts.window, limit, start);
  const nextCursor = fromDb.length === limit ? start + limit : null;
  return { entries: fromDb, nextCursor, source: 'db' };
}
