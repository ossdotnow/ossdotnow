export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { contribTotals } from '@workspace/db/schema';
import { NextRequest } from 'next/server';
import { inArray } from 'drizzle-orm';
import { db } from '@workspace/db';
import { z } from 'zod/v4';

const Body = z.object({
  userIds: z.array(z.string().min(1)).min(1).max(200),
  window: z.enum(['all', '30d', '365d']).default('30d'),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return new Response(`Bad Request: ${parsed.error.message}`, { status: 400 });
  }
  const { userIds, window } = parsed.data;

  const col =
    window === 'all'
      ? contribTotals.allTime
      : window === '30d'
        ? contribTotals.last30d
        : contribTotals.last365d;

  const rows = await db
    .select({
      userId: contribTotals.userId,
      provider: contribTotals.provider,
      score: col,
    })
    .from(contribTotals)
    .where(inArray(contribTotals.userId, userIds));

  const map = new Map<string, { userId: string; github: number; gitlab: number; total: number }>();
  for (const r of rows) {
    const id = r.userId;
    const cur = map.get(id) ?? { userId: id, github: 0, gitlab: 0, total: 0 };
    const s = Number(r.score || 0);
    if (r.provider === 'github') cur.github = s;
    else if (r.provider === 'gitlab') cur.gitlab = s;
    cur.total = cur.github + cur.gitlab;
    map.set(id, cur);
  }
  for (const id of userIds) {
    if (!map.has(id)) map.set(id, { userId: id, github: 0, gitlab: 0, total: 0 });
  }
  const data = userIds.map((id) => map.get(id)!);

  return Response.json({ ok: true, window, entries: data });
}

