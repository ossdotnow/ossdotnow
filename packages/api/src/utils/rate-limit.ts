import { Ratelimit } from '@upstash/ratelimit';
import { env } from '@workspace/env/server';
import { Redis } from '@upstash/redis';

let ratelimit: Ratelimit | null = null;

export function getRateLimiter(prefix: string) {
  if (!ratelimit) {
    const redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });

    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(2, '1m'),
      analytics: true,
      prefix: `ratelimit:${prefix}`,
    });
  }
  return ratelimit;
}
