import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod/v4';

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'production', 'test']),
    DATABASE_URL: z.string().url().startsWith('postgresql://'),
    UNKEY_ROOT_KEY: z.string().min(1),
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    GITHUB_TOKEN: z.string().min(1),
  },
  experimental__runtimeEnv: process.env,
  skipValidation: process.env.NODE_ENV !== 'production',
});
