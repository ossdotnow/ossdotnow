import { adminProcedure, createTRPCRouter, publicProcedure } from '../trpc';
import { user as userSchema, userRoleEnum } from '@workspace/db/schema';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import z from 'zod/v4';

export const usersRouter = createTRPCRouter({
  getUsername: publicProcedure.input(z.object({ id: z.string() })).query(({ ctx, input }) => {
    return ctx.db.query.user.findFirst({
      where: eq(userSchema.id, input.id),
      columns: {
        username: true,
      },
    });
  }),
  getUsers: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const id = ctx.session.userId;

      if (!id) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'UNAUTHORIZED: no user id' });
      }

      const user = await ctx.db.query.user.findFirst({
        where: eq(userSchema.id, id),
        columns: {
          role: true,
        },
      });

      if (!user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      return ctx.db.query.user.findMany({
        limit: input.limit,
        offset: input.offset,
        columns: {
          id: true,
          email: user?.role === 'admin' ? true : false,
          name: true,
          role: true,
          createdAt: true,
        },
      });
    }),
  updateUser: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(userRoleEnum.enumValues),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, role } = input;

      const [updatedUser] = await ctx.db
        .update(userSchema)
        .set({
          role,
          updatedAt: new Date(),
        })
        .where(eq(userSchema.id, userId))
        .returning();

      if (!updatedUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return updatedUser;
    }),
});
