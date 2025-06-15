CREATE TYPE "public"."project_approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "competitor" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "competitor" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "tags" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "acquired_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "project_competitors" ALTER COLUMN "project_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "project_competitors" ALTER COLUMN "alternative_project_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "project_competitors" ALTER COLUMN "alternative_competitor_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "approval_status" "project_approval_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
CREATE INDEX "project_competitors_project_id_idx" ON "project_competitors" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_competitors_alt_project_id_idx" ON "project_competitors" USING btree ("alternative_project_id");--> statement-breakpoint
CREATE INDEX "project_competitors_alt_competitor_id_idx" ON "project_competitors" USING btree ("alternative_competitor_id");