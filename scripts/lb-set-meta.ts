#!/usr/bin/env bun
import { redis } from "../packages/api/src/redis/client";

function usage() {
  console.log("Usage: bun scripts/lb-set-meta.ts --user-id <uuid> [--gh <login>] [--gl <username>] [--name <display>] [--avatar <url>]");
  process.exit(1);
}

type Args = { userId?: string; gh?: string; gl?: string; name?: string; avatar?: string; };
function parse(argv: string[]): Args {
  const a: Args = {};
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i], v = argv[i + 1];
    if (!v) continue;
    if (k === "--user-id") a.userId = v, i++;
    else if (k === "--gh") a.gh = v, i++;
    else if (k === "--gl") a.gl = v, i++;
    else if (k === "--name") a.name = v, i++;
    else if (k === "--avatar") a.avatar = v, i++;
  }
  return a;
}

const args = parse(process.argv);
if (!args.userId || (!args.gh && !args.gl && !args.name && !args.avatar)) usage();

const key = (id: string) => `lb:user:${id}`;

const updates: Record<string, string> = {};
if (args.name) updates.username = args.name;
if (args.avatar) updates.avatarUrl = args.avatar;
if (args.gh) {
  updates.githubLogin = args.gh;
  if (!updates.username) updates.username = args.gh;
  if (!updates.avatarUrl) updates.avatarUrl = `https://github.com/${args.gh}.png?size=80`;
}
if (args.gl) {
  updates.gitlabUsername = args.gl;
  if (!updates.username) updates.username = args.gl;
  if (!updates.avatarUrl) updates.avatarUrl = `https://gitlab.com/${args.gl}.png?width=80`;
}

await redis.hset(key(args.userId!), updates);
console.log("OK set", key(args.userId!), updates);
