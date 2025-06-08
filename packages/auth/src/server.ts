import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { env } from '@workspace/env/server';
import { betterAuth } from 'better-auth';
import { db } from '@workspace/db';
import 'server-only';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
