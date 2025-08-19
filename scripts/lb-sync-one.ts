/**
 * Sync one user's DB totals -> Redis ZSETs, then print Top N.
 * Usage:
 *   bun scripts/lb-sync-one.ts <user-uuid> [limit] [window]
 * Example:
 *   bun scripts/lb-sync-one.ts 11111111-1111-1111-1111-111111111111 5 30d
*/
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
// @ts-ignore -- Bun supports default import from 'postgres'
import postgres, { type Sql } from "postgres";

import { syncUserLeaderboards, topCombined } from "../packages/api/src/leaderboard/redis";

type WindowKey = "all" | "30d" | "365d";

async function makeDb(): Promise<{ db: PostgresJsDatabase; client: Sql<any> }> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DATABASE_URL");
  const needsSSL = /neon\.tech/i.test(url) || /sslmode=require/i.test(url);
  const client = postgres(url, needsSSL ? { ssl: "require" as const } : {});
  return { db: drizzle(client), client };
}

async function main() {
  const userId = process.argv[2] || "11111111-1111-1111-1111-111111111111";
  const limit = Number(process.argv[3] || 5);
  const window: WindowKey = (process.argv[4] as WindowKey) || "30d";

  const { db, client } = await makeDb();
  try {
    await syncUserLeaderboards(db, userId);
    const top = await topCombined(limit, window);
    console.log(JSON.stringify(top, null, 2));
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
