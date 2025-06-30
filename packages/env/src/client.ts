import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod/v4';

export const env = createEnv({
  client: {
    NEXT_PUBLIC_ENV: z.enum(['development', 'test', 'production']),
    NEXT_PUBLIC_VERCEL_URL: z.string().optional(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_ENV: process.env.VERCEL_ENV,
    NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,
  },
  skipValidation: process.env.VERCEL_ENV !== 'production',
});
