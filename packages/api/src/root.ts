import 'server-only';

import { createCallerFactory, createTRPCContext, createTRPCRouter } from './trpc';
import { earlyAccessRouter } from './routers/early-access';

export const appRouter = createTRPCRouter({
  earlyAccess: earlyAccessRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
export const createContext = createTRPCContext;
