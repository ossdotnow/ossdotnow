import z from 'zod';

export const waitlistForm = z.object({
  email: z.string().email(),
});

export const loginForm = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
