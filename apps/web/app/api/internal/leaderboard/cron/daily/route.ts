// apps/web/app/api/internal/leaderboard/cron/daily/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { env } from "@workspace/env/server";
import { isCronAuthorized } from "@workspace/env/verify-cron";

import { db } from "@workspace/db";
// NOTE: adjust these imports to match your barrels if needed:
import { refreshUserDayRange } from "@workspace/api/aggregator";
import { syncUserLeaderboards } from "@workspace/api/leaderboard/redis";
import { redis } from "@workspace/api/redis";

const USER_SET = "lb:users";
const META = (id: string) => `lb:user:${id}`;

const Query = z.object({
  limit: z.coerce.number().int().min(1).max(5000).default(1000),
  concurrency: z.coerce.number().int().min(1).max(8).default(4),
  dry: z
    .union([z.literal("1"), z.literal("true"), z.literal("0"), z.literal("false")])
    .optional(),
});

function startOfUtcDay(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

export async function GET(req: NextRequest) {
  // Auth: CRON_SECRET or Vercel Cron header
  const ok =
    isCronAuthorized(req.headers.get("authorization")) ||
    !!req.headers.get("x-vercel-cron");
  if (!ok) return new Response("Unauthorized", { status: 401 });

  const parsed = Query.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return new Response(`Bad Request: ${parsed.error.message}`, { status: 400 });
  }
  const { limit, concurrency, dry } = parsed.data;
  const isDry = dry === "1" || dry === "true";

  const today = startOfUtcDay(new Date());
  const yesterday = new Date(today); yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  try {
    // Quick Redis sanity check
    await redis.ping();

    // Enumerate users to process
    const allIdsRaw = await redis.smembers(USER_SET);
    const userIds = (Array.isArray(allIdsRaw) ? allIdsRaw : []).map(String).slice(0, limit);

    // Early exit if none
    if (userIds.length === 0) {
      return Response.json({
        ok: true,
        scanned: 0,
        processed: 0,
        skipped: 0,
        errors: [],
        window: { from: yesterday.toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) },
        note: `No user IDs in Redis set "${USER_SET}". Run a backfill/refresh to seed it.`,
      });
    }

    // Read provider handles from meta
    const pipe = redis.pipeline();
    for (const id of userIds) pipe.hgetall(META(id));
    const metaRows = await pipe.exec();

    let processed = 0;
    let skipped = 0;
    const errors: Array<{ userId: string; error: string }> = [];

    if (isDry) {
      // Return a preview of what would run
      const preview = userIds.map((id, i) => {
        const m = (metaRows[i] || {}) as Record<string, string | undefined>;
        return { userId: id, githubLogin: m.githubLogin || null, gitlabUsername: m.gitlabUsername || null };
      });
      return Response.json({
        ok: true,
        dryRun: true,
        scanned: userIds.length,
        sample: preview.slice(0, 10),
        window: { from: yesterday.toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) },
      });
    }

    // Bounded parallelism
    const workers = Math.max(1, Math.min(concurrency, 8));
    let idx = 0;
    const tasks = Array.from({ length: workers }, async () => {
      while (true) {
        const i = idx++;
        if (i >= userIds.length) break;

        const userId = userIds[i]!;
        const m = (metaRows[i] || {}) as Record<string, string | undefined>;
        const githubLogin = m.githubLogin?.trim() || undefined;
        const gitlabUsername = m.gitlabUsername?.trim() || undefined;

        if (!githubLogin && !gitlabUsername) {
          skipped++;
          continue;
        }

        try {
          await refreshUserDayRange(
            { db },
            {
              userId,
              githubLogin,
              gitlabUsername,
              fromDayUtc: yesterday,
              toDayUtc: today,
              githubToken: env.GITHUB_TOKEN,            // may be undefined ⇒ GH skipped
              gitlabToken: env.GITLAB_TOKEN,            // optional
              gitlabBaseUrl: env.GITLAB_ISSUER || "https://gitlab.com",
              concurrency: workers,
            },
          );

          await syncUserLeaderboards(db, userId);
          processed++;
        } catch (err: unknown) {
          errors.push({ userId, error: String(err instanceof Error ? err.message : err) });
        }
      }
    });

    await Promise.all(tasks);

    return Response.json({
      ok: true,
      scanned: userIds.length,
      processed,
      skipped,
      errors,
      window: { from: yesterday.toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) },
    });
  } catch (err: unknown) {
    // Surface the actual error during development
    const msg = String(err instanceof Error ? `${err.name}: ${err.message}` : err);
    if (env.VERCEL_ENV !== "production") {
      console.error("[cron/daily] fatal:", err);
      return new Response(`Internal Error: ${msg}`, { status: 500 });
    }
    return new Response("Internal Error", { status: 500 });
  }
}
