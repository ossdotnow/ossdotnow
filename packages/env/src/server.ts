import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod/v4';

export const env = createEnv({
  server: {
    // Environment
    VERCEL_ENV: z.enum(['development', 'production', 'preview']),
    // Database
    DATABASE_URL: z.string().url().startsWith('postgresql://'),
    // Redis
    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
    // Github
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    GITHUB_TOKEN: z.string().min(1),
    // Gitlab
    GITLAB_CLIENT_ID: z.string().min(1),
    GITLAB_CLIENT_SECRET: z.string().min(1),
    GITLAB_ISSUER: z.string().min(1),
    GITLAB_TOKEN: z.string().min(1),
  },
  experimental__runtimeEnv: process.env,
  skipValidation: process.env.NODE_ENV !== 'production',
});
