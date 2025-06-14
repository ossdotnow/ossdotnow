import { createInsertSchema } from 'drizzle-zod';
import { project } from '@workspace/db/schema';
import z from 'zod/v4';

export const waitlistForm = z.object({
  email: z.string().email(),
});

export const loginForm = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const earlySubmissionForm = createInsertSchema(project);
