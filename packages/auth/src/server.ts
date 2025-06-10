import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { env } from '@workspace/env/server';
import { admin } from 'better-auth/plugins';
import { betterAuth } from 'better-auth';
import { db } from '@workspace/db';
import 'server-only';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  plugins: [admin()],
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      scope: ['user', 'repo'],
    },
    gitlab: {
      clientId: env.GITLAB_CLIENT_ID,
      clientSecret: env.GITLAB_CLIENT_SECRET,
      issuer: env.GITLAB_ISSUER,
      scope: ['api', 'read_api', 'read_user', 'read_repository', 'openid', 'profile', 'email'],
    },
  },
  user: {
    additionalFields: {
      username: {
        type: 'string',
        required: true,
      },
    },
  },
  customPaths: {},
});

export type Session = typeof auth.$Infer.Session;
