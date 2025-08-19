// apps/web/app/api/leaderboard/export/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { getLeaderboardPage, type ProviderSel, type WindowKey } from '@workspace/api/read'; // or '@workspace/api/leaderboard/read'
import { getUserMetas } from '@workspace/api/use-meta'; // or '@workspace/api/leaderboard/userMeta'
import { contribTotals } from '@workspace/db/schema';
import { NextRequest } from 'next/server';
import { inArray } from 'drizzle-orm';
import { db } from '@workspace/db';
import { z } from 'zod/v4';

const Query = z.object({
  provider: z.enum(['combined', 'github', 'gitlab']).default('combined'),
  window: z.enum(['all', '30d', '365d']).default('30d'),
  limit: z.coerce.number().int().min(1).max(2000).default(500),
  cursor: z.coerce.number().int().min(0).default(0),
});

export async function GET(req: NextRequest) {
  const parsed = Query.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return new Response(`Bad Request: ${parsed.error.message}`, { status: 400 });
  }
  const { provider, window, limit, cursor } = parsed.data;

  // Page through leaderboard to collect up to `limit` rows
  let entries: Array<{ userId: string; score: number }> = [];
  let next = cursor;

  while (entries.length < limit) {
    const page = await getLeaderboardPage(db, {
      provider: provider as ProviderSel,
      window: window as WindowKey,
      limit: Math.min(200, limit - entries.length), // page chunk
      cursor: next,
    });
    entries.push(...page.entries);
    if (page.nextCursor == null) break;
    next = page.nextCursor;
  }
  entries = entries.slice(0, limit);

  // Per-provider breakdown for this window
  const userIds = entries.map((e) => e.userId);
  const col =
    window === 'all'
      ? contribTotals.allTime
      : window === '30d'
        ? contribTotals.last30d
        : contribTotals.last365d;

  const rows = userIds.length
    ? await db
        .select({
          userId: contribTotals.userId,
          provider: contribTotals.provider, // 'github' | 'gitlab'
          score: col,
        })
        .from(contribTotals)
        .where(inArray(contribTotals.userId, userIds))
    : [];

  // Ensure we always have an object for each userId before assignment
  const byUser: Record<string, { github: number; gitlab: number; total: number }> =
    Object.create(null);
  for (const id of userIds) byUser[id] = { github: 0, gitlab: 0, total: 0 };

  for (const r of rows) {
    const s = Number(r.score ?? 0);
    const u = (byUser[r.userId] ??= { github: 0, gitlab: 0, total: 0 });
    if (r.provider === 'github') u.github = s;
    else if (r.provider === 'gitlab') u.gitlab = s;
  }
  for (const id of userIds) {
    const u = byUser[id];
    if (u) {
      u.total = u.github + u.gitlab;
    }
  }

  // Profiles (username/avatar; avatar not used in CSV)
  const metas = await getUserMetas(userIds);
  const metaMap = new Map(metas.map((m) => [m.userId, m]));

  // Build CSV
  const header = [
    'rank',
    'userId',
    'username',
    'githubLogin',
    'gitlabUsername',
    'total',
    'github',
    'gitlab',
  ];

  const lines = [header.join(',')];

  entries.forEach((e, idx) => {
    const rank = cursor + idx + 1;
    const m = metaMap.get(e.userId);
    const agg = byUser[e.userId] || { github: 0, gitlab: 0, total: e.score };
    const row = [
      rank,
      e.userId,
      m?.username ?? '',
      m?.githubLogin ?? '',
      m?.gitlabUsername ?? '',
      agg.total,
      agg.github,
      agg.gitlab,
    ]
      .map((v) => (typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : String(v)))
      .join(',');

    lines.push(row);
  });

  const csv = lines.join('\n');
  const filename = `leaderboard_${provider}_${window}_${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
