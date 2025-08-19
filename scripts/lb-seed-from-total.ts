#!/usr/bin/env bun
/**
 * Seed Redis set lb:users from contrib_totals (distinct userIds).
 * Usage:
 *   bun scripts/lb-seed-from-totals.ts
 *
 * Requires:
 *   DATABASE_URL
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

import { drizzle } from "drizzle-orm/postgres-js";
import { contribTotals } from "../packages/db/src/schema/contributions";
import { redis } from "../packages/api/src/redis/client";

async function makeDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DATABASE_URL");
  // dynamic import sidesteps TS "export ="/default issues without changing tsconfig
  const { default: postgres } = await import("postgres");
  const needsSSL = /neon\.tech/i.test(url) || /sslmode=require/i.test(url);
  const client = postgres(url, needsSSL ? { ssl: "require" as const } : {});
  return drizzle(client);
}

async function main() {
  const db = await makeDb();

  const rows = await db
    .select({ userId: contribTotals.userId })
    .from(contribTotals)
    .groupBy(contribTotals.userId);

  const idArray: string[] = Array.from(new Set(rows.map((r) => r.userId)));

  if (idArray.length === 0) {
    console.log("No users found in contrib_totals");
    return;
  }

  const pipe = redis.pipeline();
  for (const id of idArray) pipe.sadd("lb:users", id);
  await pipe.exec();

  console.log(`Seeded ${idArray.length} userIds into Redis set lb:users`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
