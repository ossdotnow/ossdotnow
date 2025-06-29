import 'server-only';

import { earlySubmissionRouter } from './routers/early-submissions';
import { createTRPCContext, createTRPCRouter } from './trpc';
import { earlyAccessRouter } from './routers/early-access';
import { repositoryRouter } from './routers/repository';
import { categoriesRouter } from './routers/categories';
import { projectsRouter } from './routers/projects';
import { profileRouter } from './routers/profile';
import { usersRouter } from './routers/users';
import { adminRouter } from './routers/admin';
import { userRouter } from './routers/user';

export const appRouter = createTRPCRouter({
  earlyAccess: earlyAccessRouter,
  user: userRouter,
  users: usersRouter,
  projects: projectsRouter,
  categories: categoriesRouter,
  earlySubmission: earlySubmissionRouter,
  repository: repositoryRouter,
  admin: adminRouter,
  profile: profileRouter,
});

export type AppRouter = typeof appRouter;

export const createContext = createTRPCContext;

export type { DebugPermissionsResult } from './routers/projects';
