export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { z } from 'zod/v4';

import { isCronAuthorized } from '@workspace/env/verify-cron';
import { env } from '@workspace/env/server';

import { backfillLockKey, withLock, acquireLock, releaseLock } from '@workspace/api/locks';
import { refreshUserDayRange } from '@workspace/api/aggregator';
import { setUserMetaFromProviders } from '@workspace/api/meta';
import { syncUserLeaderboards } from '@workspace/api/redis';
import { db } from '@workspace/db';

function startOfUtcDay(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function addDaysUTC(d: Date, days: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

function ymd(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

const Body = z
  .object({
    userId: z.string().min(1),
    githubLogin: z.string().min(1).optional(),
    gitlabUsername: z.string().min(1).optional(),
    days: z.number().int().min(1).max(365).optional(),
    concurrency: z.number().int().min(1).max(8).optional(),
  })
  .refine((b) => !!b.githubLogin || !!b.gitlabUsername, {
    message: 'At least one of githubLogin or gitlabUsername is required.',
  });

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!isCronAuthorized(auth)) return new Response('Unauthorized', { status: 401 });

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) return new Response(`Bad Request: ${parsed.error.message}`, { status: 400 });
  const body = parsed.data;

  const today = startOfUtcDay(new Date());
  const days = Math.min(Math.max(body.days ?? 30, 1), 365);
  const from = addDaysUTC(today, -(days - 1));

  const providers = (
    [
      ...(body.githubLogin ? (['github'] as const) : []),
      ...(body.gitlabUsername ? (['gitlab'] as const) : []),
    ] as Array<'github' | 'gitlab'>
  ).sort();

  const ttlSec = Math.min(15 * 60, Math.max(2 * 60, days * 2));

  const autoConcurrency = days > 180 ? 3 : days > 60 ? 4 : 6;
  const concurrency = Math.min(Math.max(body.concurrency ?? autoConcurrency, 1), 8);

  const githubToken = env.GITHUB_TOKEN;
  const gitlabToken = env.GITLAB_TOKEN;
  const gitlabBaseUrl = env.GITLAB_ISSUER || 'https://gitlab.com';

  async function run() {
    const res = await refreshUserDayRange(
      { db },
      {
        userId: body.userId,
        githubLogin: body.githubLogin?.trim(),
        gitlabUsername: body.gitlabUsername?.trim(),
        fromDayUtc: from,
        toDayUtc: today,
        githubToken,
        gitlabToken,
        gitlabBaseUrl,
        concurrency,
      },
    );
    await syncUserLeaderboards(db, body.userId);
    await setUserMetaFromProviders(body.userId, body.githubLogin, body.gitlabUsername);
    return res;
  }

  try {
    if (providers.length === 2) {
      const k1 = backfillLockKey(providers[0]!, body.userId);
      const k2 = backfillLockKey(providers[1]!, body.userId);
      return await withLock(k1, ttlSec, async () => {
        const got2 = await acquireLock(k2, ttlSec);
        if (!got2) throw new Error(`LOCK_CONFLICT:${providers[1]}`);
        try {
          const out = await run();
          return Response.json({
            ok: true,
            userId: body.userId,
            providers,
            window: { from: ymd(from), to: ymd(today) },
            daysRefreshed: out.daysRefreshed,
            concurrency,
          });
        } finally {
          await releaseLock(k2);
        }
      });
    }

    const p = providers[0]!;
    const key = backfillLockKey(p, body.userId);
    return await withLock(key, ttlSec, async () => {
      const out = await run();
      return Response.json({
        ok: true,
        userId: body.userId,
        providers,
        window: { from: ymd(from), to: ymd(today) },
        daysRefreshed: out.daysRefreshed,
        concurrency,
      });
    });
  } catch (err: unknown) {
    const msg = String(err instanceof Error ? err.message : err);
    if (msg.startsWith('LOCK_CONFLICT')) {
      const p = msg.split(':')[1] || 'unknown';
      return new Response(`Conflict: backfill already running for ${p}`, { status: 409 });
    }
    return new Response(`Internal Error: ${msg}`, { status: 500 });
  }
}
