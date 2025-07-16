import { project, user, waitlist } from '@workspace/db/schema';
import { adminProcedure, createTRPCRouter } from '../trpc';
import { count, desc, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const adminRouter = createTRPCRouter({
  dashboard: adminProcedure.query(async ({ ctx }) => {
    const usersCount = await ctx.db.select({ count: count() }).from(user);
    const projectsCount = await ctx.db.select({ count: count() }).from(project);
    const earlyAccessCount = await ctx.db.select({ count: count() }).from(waitlist);
    const pendingProjectsCount = await ctx.db
      .select({ count: count() })
      .from(project)
      .where(eq(project.approvalStatus, 'pending'));

    // get the latest 5 projects
    const latestProjects = await ctx.db
      .select()
      .from(project)
      .orderBy(desc(project.createdAt))
      .limit(5);

    if (!usersCount[0] || !projectsCount[0] || !earlyAccessCount[0]) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get waitlist count',
      });
    }

    return {
      counts: {
        users: usersCount[0].count ?? 0,
        projects: projectsCount[0].count ?? 0,
        earlyAccess: earlyAccessCount[0].count ?? 0,
        pendingProjects: pendingProjectsCount[0]?.count ?? 0,
      },
      latestProjects,
    };
  }),
});
