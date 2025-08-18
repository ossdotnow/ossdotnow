export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod/v4";

import { db } from "@workspace/db";
import { getLeaderboardPage, type WindowKey, type ProviderSel } from "@workspace/api/read";

const Query = z.object({
  window: z.enum(["all", "30d", "365d"]).default("30d"),
  provider: z.enum(["combined", "github", "gitlab"]).default("combined"),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.coerce.number().int().min(0).optional(),
});

export async function GET(req: NextRequest) {
  const parsed = Query.safeParse(Object.fromEntries(req.nextUrl.searchParams.entries()));
  if (!parsed.success) {
    return new Response(`Bad Request: ${parsed.error.message}`, { status: 400 });
  }
  const q = parsed.data;

  const { entries, nextCursor, source } = await getLeaderboardPage(db, {
    window: q.window as WindowKey,
    provider: q.provider as ProviderSel,
    limit: q.limit,
    cursor: q.cursor,
  });

  return Response.json({
    ok: true,
    window: q.window,
    provider: q.provider,
    limit: q.limit,
    cursor: q.cursor ?? 0,
    nextCursor,
    source,
    entries,
  });
}
