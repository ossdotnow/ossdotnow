import { redis } from "../redis/client";

export type UserMeta = {
  userId: string;
  username?: string;
  avatarUrl?: string;
  githubLogin?: string;
  gitlabUsername?: string;
};

const metaKey = (userId: string) => `lb:user:${userId}`;

export async function setUserMetaFromProviders(
  userId: string,
  githubLogin?: string | null,
  gitlabUsername?: string | null,
): Promise<void> {
  const updates: Record<string, string> = {};

  if (githubLogin && githubLogin.trim()) {
    const gh = githubLogin.trim();
    updates.githubLogin = gh;
    if (!updates.username) updates.username = gh;
    if (!updates.avatarUrl) updates.avatarUrl = `https://github.com/${gh}.png?size=80`;
  }
  if (gitlabUsername && gitlabUsername.trim()) {
    const gl = gitlabUsername.trim();
    updates.gitlabUsername = gl;
    if (!updates.username) updates.username = gl;
    if (!updates.avatarUrl) updates.avatarUrl = `https://gitlab.com/${gl}.png?width=80`;
  }

  if (Object.keys(updates).length > 0) {
    await redis.hset(metaKey(userId), updates);
  }
}

/** Bulk read profile meta for a list of userIds (order preserved). */
export async function getUserMetas(userIds: string[]): Promise<UserMeta[]> {
  const pipe = redis.pipeline();
  for (const id of userIds) pipe.hgetall(metaKey(id));
  const rows = await pipe.exec();

  return rows.map((raw, i) => {
    const id = userIds[i]!;
    const m = (raw || {}) as Record<string, string | undefined>;
    const username = m.username || m.githubLogin || m.gitlabUsername || id.slice(0, 8);
    const avatarUrl =
      m.avatarUrl ||
      (m.githubLogin ? `https://github.com/${m.githubLogin}.png?size=80` : undefined) ||
      (m.gitlabUsername ? `https://gitlab.com/${m.gitlabUsername}.png?width=80` : undefined);

    return {
      userId: id,
      username,
      avatarUrl,
      githubLogin: m.githubLogin,
      gitlabUsername: m.gitlabUsername,
    };
  });
}
