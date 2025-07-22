import { Ratelimit } from '@unkey/ratelimit';
import { env } from '@workspace/env/server';

const ratelimitCache: Record<string, Ratelimit> = {};

export function getRateLimiter(namespace: string): Ratelimit {
  if (!ratelimitCache[namespace]) {
    ratelimitCache[namespace] = new Ratelimit({
      duration: 60 * 1000,
      limit: 2,
      rootKey: env.UNKEY_ROOT_KEY,
      namespace,
    });
  }
  return ratelimitCache[namespace];
}
