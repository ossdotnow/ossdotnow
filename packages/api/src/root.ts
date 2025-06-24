import 'server-only';

import { earlySubmissionRouter } from './routers/early-submissions';
import { createTRPCContext, createTRPCRouter } from './trpc';
import { earlyAccessRouter } from './routers/early-access';
import { repositoryRouter } from './routers/repository';
import { projectsRouter } from './routers/projects';
import { usersRouter } from './routers/users';
import { adminRouter } from './routers/admin';
import { userRouter } from './routers/user';

export const appRouter = createTRPCRouter({
  earlyAccess: earlyAccessRouter,
  user: userRouter,
  users: usersRouter,
  projects: projectsRouter,
  earlySubmission: earlySubmissionRouter,
  repository: repositoryRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;

export const createContext = createTRPCContext;

export type { DebugPermissionsResult } from './routers/projects';
