import 'server-only';

import { earlySubmissionRouter } from './routers/early-submissions';
import { createTRPCContext, createTRPCRouter } from './trpc';
import { earlyAccessRouter } from './routers/early-access';
import { projectsRouter } from './routers/projects';
import { githubRouter } from './routers/github';
import { userRouter } from './routers/user';

export const appRouter = createTRPCRouter({
  earlyAccess: earlyAccessRouter,
  user: userRouter,
  projects: projectsRouter,
  earlySubmission: earlySubmissionRouter,
  github: githubRouter,
});

export type AppRouter = typeof appRouter;

export const createContext = createTRPCContext;

export type { DebugPermissionsResult } from './routers/projects';
