ALTER TYPE "public"."tags" ADD VALUE 'dapp';--> statement-breakpoint
ALTER TYPE "public"."tags" ADD VALUE 'saas';--> statement-breakpoint
ALTER TYPE "public"."tags" ADD VALUE 'algorithm';--> statement-breakpoint
ALTER TYPE "public"."tags" ADD VALUE 'data-analysis';--> statement-breakpoint
ALTER TYPE "public"."tags" ADD VALUE 'game-engine';--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "is_looking_for_contributors" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "is_looking_for_investors" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "is_hiring" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "is_public" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "has_been_acquired" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "impersonated_by" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banned" boolean;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_expires" timestamp;