export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod/v4";

import { env } from "@workspace/env/server";
import { isCronAuthorized } from "@workspace/env/verify-cron";

import { db } from "@workspace/db";
import { refreshUserDayRange } from "@workspace/api/aggregator";
import { syncUserLeaderboards } from "@workspace/api/redis";
import { withLock, acquireLock, releaseLock } from "@workspace/api/locks";

function startOfUtcDay(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function ymd(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

const Body = z
  .object({
    userId: z.string().min(1),
    githubLogin: z.string().min(1).optional(),
    gitlabUsername: z.string().min(1).optional(),
    fromDayUtc: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    toDayUtc: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    concurrency: z.number().int().min(1).max(8).optional(),
  })
  .refine((b) => !!b.githubLogin || !!b.gitlabUsername, {
    message: "At least one of githubLogin or gitlabUsername is required.",
  });

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!isCronAuthorized(auth)) return new Response("Unauthorized", { status: 401 });

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) return new Response(`Bad Request: ${parsed.error.message}`, { status: 400 });
  const body = parsed.data;

  const today = startOfUtcDay(new Date());
  const yesterday = startOfUtcDay(new Date(today));
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  const fromDay = body.fromDayUtc ? new Date(`${body.fromDayUtc}T00:00:00Z`) : yesterday;
  const toDay = body.toDayUtc ? new Date(`${body.toDayUtc}T00:00:00Z`) : today;
  if (fromDay.getTime() > toDay.getTime()) {
    return new Response("Bad Request: fromDayUtc must be <= toDayUtc", { status: 400 });
  }

  const providers = ([
    ...(body.githubLogin ? (["github"] as const) : []),
    ...(body.gitlabUsername ? (["gitlab"] as const) : []),
  ] as Array<"github" | "gitlab">).sort();

  const ttlSec = 3 * 60;

  const autoConcurrency = 6;
  const concurrency = Math.min(Math.max(body.concurrency ?? autoConcurrency, 1), 8);

  const githubToken =  env.GITHUB_TOKEN;
  const gitlabToken = env.GITLAB_TOKEN;
  const gitlabBaseUrl = env.GITLAB_ISSUER || "https://gitlab.com";

  const lockKey = (p: "github" | "gitlab") =>
    `lock:refresh:${p}:${body.userId}:${ymd(fromDay)}:${ymd(toDay)}`;

  async function run() {
    const res = await refreshUserDayRange(
      { db },
      {
        userId: body.userId,
        githubLogin: body.githubLogin?.trim(),
        gitlabUsername: body.gitlabUsername?.trim(),
        fromDayUtc: fromDay,
        toDayUtc: toDay,
        githubToken,
        gitlabToken,
        gitlabBaseUrl,
        concurrency,
      },
    );
    await syncUserLeaderboards(db, body.userId);
    return res;
  }

  try {
    if (providers.length === 2) {
      const k1 = lockKey(providers[0]!);
      const k2 = lockKey(providers[1]!);
      return await withLock(k1, ttlSec, async () => {
        const got2 = await acquireLock(k2, ttlSec);
        if (!got2) throw new Error(`LOCK_CONFLICT:${providers[1]}`);
        try {
          const out = await run();
          return Response.json({
            ok: true,
            userId: body.userId,
            providers,
            range: { from: ymd(fromDay), to: ymd(toDay) },
            daysRefreshed: out.daysRefreshed,
            concurrency,
          });
        } finally {
          await releaseLock(k2);
        }
      });
    }

    const p = providers[0]!;
    return await withLock(lockKey(p), ttlSec, async () => {
      const out = await run();
      return Response.json({
        ok: true,
        userId: body.userId,
        providers,
        range: { from: ymd(fromDay), to: ymd(toDay) },
        daysRefreshed: out.daysRefreshed,
        concurrency,
      });
    });
  } catch (err: unknown) {
    const msg = String(err instanceof Error ? err.message : err);
    if (msg.startsWith("LOCK_CONFLICT")) {
      const p = msg.split(":")[1] || "unknown";
      return new Response(`Conflict: refresh already running for ${p}`, { status: 409 });
    }
    return new Response(`Internal Error: ${msg}`, { status: 500 });
  }
}
