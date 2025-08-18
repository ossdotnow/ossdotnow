import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { secondaryStorage } from './secondary-storage';
import { env } from '@workspace/env/server';
import { admin } from 'better-auth/plugins';
import { betterAuth } from 'better-auth';
import { db } from '@workspace/db';
import 'server-only';

import { syncUserLeaderboards } from '@workspace/api/leaderboard/redis';
import { createAuthMiddleware } from 'better-auth/api';
import { setUserMeta } from '@workspace/api/meta';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  secondaryStorage: secondaryStorage(),
  plugins: [
    admin({
      adminRoles: ['admin', 'moderator'],
    }),
  ],
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const session = ctx.context.newSession;
      if (!session) return;

      const userId = session.user.id;
      const path = ctx.path || '';
      const username = session.user?.username as string | undefined;

      let githubLogin: string | undefined;
      let gitlabUsername: string | undefined;

      if (path.includes('/oauth/github') || path.includes('/sign-up/github')) {
        githubLogin = username;
      } else if (path.includes('/oauth/gitlab') || path.includes('/sign-up/gitlab')) {
        gitlabUsername = username;
      }

      try {
        await setUserMeta(
          userId,
          { githubLogin, gitlabUsername },
          { seedLeaderboards: false },
        );
      } catch (e) {
        console.error('setUserMeta failed:', e);
      }

      try {
        await syncUserLeaderboards(db, userId);
      } catch (e) {
        console.error('syncUserLeaderboards failed:', e);
      }
    }),
  },

  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      scope: ['user', 'repo'],
      mapProfileToUser: async (profile) => {
        return {
          username: profile.login,
          image: profile.avatar_url,
        };
      },
    },
    gitlab: {
      clientId: env.GITLAB_CLIENT_ID,
      clientSecret: env.GITLAB_CLIENT_SECRET,
      issuer: env.GITLAB_ISSUER,
      scope: ['api', 'read_api', 'read_user', 'read_repository', 'openid', 'profile', 'email'],
      mapProfileToUser: async (profile) => {
        return {
          username: profile.username,
          image: profile.avatar_url,
        };
      },
      overrideUserInfoOnSignIn: true,
    },
  },
  user: {
    additionalFields: {
      username: {
        type: 'string',
        required: true,
      },
      image: {
        type: 'string',
        required: true,
      },
    },
  },
  customPaths: {},
});

export type Session = typeof auth.$Infer.Session;
