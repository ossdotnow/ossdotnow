import { createInsertSchema } from 'drizzle-zod';
import { project } from '@workspace/db/schema';
import { z } from 'zod/v4';

export const waitlistForm = z.object({
  email: z.email(),
});

export const loginForm = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const earlySubmissionForm = createInsertSchema(project).extend({
  gitRepoUrl: z
    .string()
    .regex(/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/, {
      message: 'Invalid GitHub repository format. Use: username/repository',
    })
    .optional()
    .or(z.literal('')),
});
