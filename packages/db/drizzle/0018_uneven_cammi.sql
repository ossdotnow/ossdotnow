ALTER TABLE "project" ADD COLUMN "stars_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "forks_count" integer DEFAULT 0 NOT NULL;