-- CREATE TABLE "waitlist" (
-- 	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
-- 	"email" text NOT NULL,
-- 	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
-- 	CONSTRAINT "waitlist_email_unique" UNIQUE("email")
-- );

-- 0000_create_waitlist_table.sql
CREATE TABLE IF NOT EXISTS "waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_email_unique" UNIQUE("email")
);
