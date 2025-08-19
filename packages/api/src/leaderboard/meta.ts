// packages/api/src/leaderboard/meta.ts
import { redis } from "../redis/client";
import { syncUserLeaderboards } from "./redis";

const USER_SET = "lb:users";
const META = (id: string) => `lb:user:${id}`;

export type UserMetaInput = {
  githubLogin?: string | null;
  gitlabUsername?: string | null;
};

export async function setUserMeta(
  userId: string,
  meta: UserMetaInput,
  opts: { seedLeaderboards?: boolean } = { seedLeaderboards: true },
): Promise<void> {
  const updates: Record<string, string> = {};
  if (meta.githubLogin != null && meta.githubLogin.trim() !== "") {
    updates.githubLogin = meta.githubLogin.trim();
  }
  if (meta.gitlabUsername != null && meta.gitlabUsername.trim() !== "") {
    updates.gitlabUsername = meta.gitlabUsername.trim();
  }

  const pipe = redis.pipeline();
  if (Object.keys(updates).length > 0) {
    pipe.hset(META(userId), updates);
  }
  pipe.sadd(USER_SET, userId);
  await pipe.exec();

  if (opts.seedLeaderboards) {
    try {
      const { db } = await import("@workspace/db");
      await syncUserLeaderboards(db, userId);
    } catch (err) {
      console.error("[setUserMeta] syncUserLeaderboards failed:", err);
    }
  }
}
