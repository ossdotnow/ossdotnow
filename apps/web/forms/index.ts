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
  name: z.string().min(1, 'Project name is required'),
  description: z.string().min(1, 'Project description is required'),
  gitRepoUrl: z
    .string()
    .refine((val) => !val || val === '' || /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/.test(val), {
      message: 'Invalid GitHub repository format. Use: username/repository',
    })
    .min(1, 'Repository URL is required'),
  socialLinks: z
    .object({
      twitter: z.string().url('Invalid URL format').optional().or(z.literal('')),
      discord: z.string().url('Invalid URL format').optional().or(z.literal('')),
      linkedin: z.string().url('Invalid URL format').optional().or(z.literal('')),
      website: z.string().url('Invalid URL format').optional().or(z.literal('')),
    })
    .optional(),
});
