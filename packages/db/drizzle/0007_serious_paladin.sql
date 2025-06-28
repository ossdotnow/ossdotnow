CREATE TYPE "public"."project_provider" AS ENUM('github', 'gitlab');--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "image" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "username" text NOT NULL;