import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const waitlist = pgTable('waitlist', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text().notNull().unique(),
  joinedAt: timestamp('joined_at', {
    mode: 'date',
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});
