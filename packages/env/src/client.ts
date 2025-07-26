import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod/v4';

export const env = createEnv({
  client: {
    NEXT_PUBLIC_VERCEL_ENV: z.enum(['development', 'test', 'production']),
    NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
    // Sentry
    NEXT_PUBLIC_SENTRY_DSN: z.string().min(1),
    // Databuddy
    NEXT_PUBLIC_DATABUDDY_CLIENT_ID: z.string().min(1),
  },
  runtimeEnv: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
    NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL:
      process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_DATABUDDY_CLIENT_ID: process.env.NEXT_PUBLIC_DATABUDDY_CLIENT_ID,
  },
  skipValidation: process.env.VERCEL_ENV !== 'production',
});
