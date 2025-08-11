// packages/db/src/schema/contributions.ts
import {
  pgEnum,
  pgTable,
  uuid,
  date,
  integer,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/**
 * Keep provider values narrow and explicit.
 * Name the enum specifically for this feature to avoid collisions.
 */
export const contribProvider = pgEnum("contrib_provider", ["github", "gitlab"]);

/**
 * Grain: 1 row per (user_id, provider, date_utc).
 * Used for daily deltas and rolling-window math.
 */
export const contribDaily = pgTable(
  "contrib_daily",
  {
    userId: uuid("user_id").notNull(), // FK to users.id (kept loose here to avoid cross-package import loops)
    provider: contribProvider("provider").notNull(),
    dateUtc: date("date_utc").notNull(), // UTC calendar day

    commits: integer("commits").notNull().default(0),
    prs: integer("prs").notNull().default(0),
    issues: integer("issues").notNull().default(0),

    // Bookkeeping
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // Idempotency & fast upserts
    uniqueIndex("contrib_daily_user_prov_day_uidx").on(
      t.userId,
      t.provider,
      t.dateUtc,
    ),
    // Helpful for rebuilds or per-day scans
    index("contrib_daily_provider_day_idx").on(t.provider, t.dateUtc),
    index("contrib_daily_user_day_idx").on(t.userId, t.dateUtc),
  ],
);

/**
 * Pre-aggregated, for fast reads:
 *   - allTime = lifetime public contributions
 *   - last30d, last365d maintained via rolling updates
 */
export const contribTotals = pgTable(
  "contrib_totals",
  {
    userId: uuid("user_id").notNull(),
    provider: contribProvider("provider").notNull(),

    allTime: integer("all_time").notNull().default(0),
    last30d: integer("last_30d").notNull().default(0),
    last365d: integer("last_365d").notNull().default(0),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("contrib_totals_user_prov_uidx").on(t.userId, t.provider),
    index("contrib_totals_user_idx").on(t.userId),
  ],
);

/**
 * NOTE on FKs:
 * If your users table is exported in this package as `users`,
 * you may add `.references(() => users.id)` to the `userId` columns.
 * We keep it decoupled here to avoid cross-file import cycles in monorepos.
 */
