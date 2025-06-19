import { Ratelimit } from '@upstash/ratelimit';
import { env } from '@workspace/env/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

const ratelimitCache: Record<string, Ratelimit> = {};

export function getRateLimiter(prefix: string): Ratelimit {
  if (!ratelimitCache[prefix]) {
    ratelimitCache[prefix] = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(2, '1m'),
      analytics: true,
      prefix: `ratelimit:${prefix}`,
    });
  }
  return ratelimitCache[prefix];
}
