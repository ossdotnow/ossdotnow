CREATE TYPE "public"."launch_status" AS ENUM('scheduled', 'live', 'ended');--> statement-breakpoint
ALTER TABLE "project_launch" ADD COLUMN "status" "launch_status" DEFAULT 'scheduled' NOT NULL;--> statement-breakpoint
CREATE INDEX "project_launch_status_idx" ON "project_launch" USING btree ("status");