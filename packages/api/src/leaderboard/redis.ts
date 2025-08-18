import { contribTotals } from '@workspace/db/schema';
import { redis } from '../redis/client';
import type { DB } from '@workspace/db';
import { eq } from 'drizzle-orm';

type ProviderKey = 'github' | 'gitlab';
type WindowKey = 'all' | '30d' | '365d';

const COMBINED_KEYS = {
  all: 'lb:total:all',
  '30d': 'lb:total:30d',
  '365d': 'lb:total:365d',
} as const;

const PROVIDER_KEYS: Record<ProviderKey, Record<WindowKey, string>> = {
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

const USER_SET = 'lb:users';

export async function syncUserLeaderboards(db: DB, userId: string): Promise<void> {
  const rows = await db
    .select({
      provider: contribTotals.provider,
      allTime: contribTotals.allTime,
      last30d: contribTotals.last30d,
      last365d: contribTotals.last365d,
    })
    .from(contribTotals)
    .where(eq(contribTotals.userId, userId));

  let combinedAll = 0;
  let combined30 = 0;
  let combined365 = 0;

  const pipe = redis.pipeline();

  for (const r of rows) {
    const p = r.provider as ProviderKey;
    const all = Number(r.allTime || 0);
    const d30 = Number(r.last30d || 0);
    const d365 = Number(r.last365d || 0);

    combinedAll += all;
    combined30 += d30;
    combined365 += d365;

    const k = PROVIDER_KEYS[p];
    pipe.zadd(k.all, { score: all, member: userId });
    pipe.zadd(k['30d'], { score: d30, member: userId });
    pipe.zadd(k['365d'], { score: d365, member: userId });
  }

  // Always write combined sets (even zeros) for stable ordering
  pipe.zadd(COMBINED_KEYS.all, { score: combinedAll, member: userId });
  pipe.zadd(COMBINED_KEYS['30d'], { score: combined30, member: userId });
  pipe.zadd(COMBINED_KEYS['365d'], { score: combined365, member: userId });

  pipe.sadd(USER_SET, userId);

  await pipe.exec();
}

export async function removeUserFromLeaderboards(userId: string): Promise<void> {
  const keys = [
    COMBINED_KEYS.all,
    COMBINED_KEYS['30d'],
    COMBINED_KEYS['365d'],
    ...Object.values(PROVIDER_KEYS).flatMap((k) => [k.all, k['30d'], k['365d']]),
  ];
  const pipe = redis.pipeline();
  for (const k of keys) pipe.zrem(k, userId);
  await pipe.exec();
}

export async function topCombined(limit = 10, window: WindowKey = '30d') {
  const key = COMBINED_KEYS[window];
  const res = await redis.zrange(key, 0, limit - 1, {
    rev: true,
    withScores: true,
  });

  if (
    Array.isArray(res) &&
    res.length &&
    typeof res[0] === 'object' &&
    res[0] &&
    'member' in res[0]
  ) {
    return (res as Array<{ member: string; score: number | string }>).map(({ member, score }) => ({
      userId: member,
      score: typeof score === 'string' ? Number(score) : Number(score ?? 0),
    }));
  }

  if (Array.isArray(res)) {
    const out: Array<{ userId: string; score: number }> = [];
    for (let i = 0; i < res.length; i += 2) {
      const member = String(res[i] ?? '');
      const score = Number(res[i + 1] ?? 0);
      out.push({ userId: member, score });
    }
    return out;
  }

  return [];
}

export async function allKnownUserIds(): Promise<string[]> {
  const ids = await redis.smembers(USER_SET);
  return Array.isArray(ids) ? ids.map(String) : [];
}
