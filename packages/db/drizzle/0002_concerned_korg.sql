-- CREATE TYPE "public"."acquisition_type" AS ENUM('ipo', 'acquisition', 'other');--> statement-breakpoint
-- CREATE TYPE "public"."project_status" AS ENUM('active', 'inactive', 'early-stage', 'beta', 'production-ready', 'experimental', 'cancelled', 'paused');--> statement-breakpoint
-- CREATE TYPE "public"."project_type" AS ENUM('fintech', 'healthtech', 'edtech', 'ecommerce', 'productivity', 'social', 'entertainment', 'developer-tools', 'content-management', 'analytics', 'other');--> statement-breakpoint
-- CREATE TYPE "public"."alternative_competitor_type" AS ENUM('project', 'competitor');--> statement-breakpoint
-- CREATE TYPE "public"."git_host" AS ENUM('github', 'gitlab');--> statement-breakpoint
-- CREATE TYPE "public"."tags" AS ENUM('web', 'mobile', 'desktop', 'backend', 'frontend', 'fullstack', 'ai', 'game', 'crypto', 'nft', 'social', 'other');--> statement-breakpoint
-- CREATE TABLE "competitor" (
-- 	"id" text PRIMARY KEY NOT NULL,
-- 	"logo_url" text,
-- 	"git_repo_url" text,
-- 	"git_host" "git_host",
-- 	"name" text NOT NULL,
-- 	"description" text,
-- 	"social_links" jsonb,
-- 	"tags" "tags"[],
-- 	"deleted_at" timestamp,
-- 	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
-- 	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
-- );
-- --> statement-breakpoint
-- CREATE TABLE "project" (
-- 	"id" text PRIMARY KEY NOT NULL,
-- 	"owner_id" text,
-- 	"logo_url" text,
-- 	"git_repo_url" text,
-- 	"git_host" "git_host",
-- 	"name" text NOT NULL,
-- 	"description" text,
-- 	"social_links" jsonb,
-- 	"tags" "tags"[],
-- 	"status" "project_status" NOT NULL,
-- 	"type" "project_type" NOT NULL,
-- 	"is_looking_for_contributors" boolean NOT NULL,
-- 	"is_looking_for_investors" boolean NOT NULL,
-- 	"is_hiring" boolean NOT NULL,
-- 	"is_public" boolean NOT NULL,
-- 	"has_been_acquired" boolean NOT NULL,
-- 	"acquired_by" text,
-- 	"deleted_at" timestamp,
-- 	"created_at" timestamp with time zone NOT NULL,
-- 	"updated_at" timestamp with time zone NOT NULL
-- );
-- --> statement-breakpoint
-- CREATE TABLE "project_competitors" (
-- 	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
-- 	"project_id" text NOT NULL,
-- 	"alternative_competitor_type" "alternative_competitor_type" NOT NULL,
-- 	"alternative_project_id" text,
-- 	"alternative_competitor_id" text,
-- 	"created_at" timestamp with time zone DEFAULT now() NOT NULL
-- );
-- --> statement-breakpoint
-- ALTER TABLE "project" ADD CONSTRAINT "project_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- ALTER TABLE "project" ADD CONSTRAINT "project_acquired_by_competitor_id_fk" FOREIGN KEY ("acquired_by") REFERENCES "public"."competitor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- ALTER TABLE "project_competitors" ADD CONSTRAINT "project_competitors_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- ALTER TABLE "project_competitors" ADD CONSTRAINT "project_competitors_alternative_project_id_project_id_fk" FOREIGN KEY ("alternative_project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- ALTER TABLE "project_competitors" ADD CONSTRAINT "project_competitors_alternative_competitor_id_competitor_id_fk" FOREIGN KEY ("alternative_competitor_id") REFERENCES "public"."competitor"("id") ON DELETE cascade ON UPDATE no action;

-- Create enum types with IF NOT EXISTS equivalent using DO blocks
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'acquisition_type') THEN
        CREATE TYPE "public"."acquisition_type" AS ENUM('ipo', 'acquisition', 'other');
    END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
        CREATE TYPE "public"."project_status" AS ENUM('active', 'inactive', 'early-stage', 'beta', 'production-ready', 'experimental', 'cancelled', 'paused');
    END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_type') THEN
        CREATE TYPE "public"."project_type" AS ENUM('fintech', 'healthtech', 'edtech', 'ecommerce', 'productivity', 'social', 'entertainment', 'developer-tools', 'content-management', 'analytics', 'other');
    END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alternative_competitor_type') THEN
        CREATE TYPE "public"."alternative_competitor_type" AS ENUM('project', 'competitor');
    END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'git_host') THEN
        CREATE TYPE "public"."git_host" AS ENUM('github', 'gitlab');
    END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tags') THEN
        CREATE TYPE "public"."tags" AS ENUM('web', 'mobile', 'desktop', 'backend', 'frontend', 'fullstack', 'ai', 'game', 'crypto', 'nft', 'social', 'other');
    END IF;
END $$;
--> statement-breakpoint

-- Create tables with IF NOT EXISTS
CREATE TABLE IF NOT EXISTS "competitor" (
	"id" text PRIMARY KEY NOT NULL,
	"logo_url" text,
	"git_repo_url" text,
	"git_host" "git_host",
	"name" text NOT NULL,
	"description" text,
	"social_links" jsonb,
	"tags" "tags"[],
	"deleted_at" timestamp,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "project" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text,
	"logo_url" text,
	"git_repo_url" text,
	"git_host" "git_host",
	"name" text NOT NULL,
	"description" text,
	"social_links" jsonb,
	"tags" "tags"[],
	"status" "project_status" NOT NULL,
	"type" "project_type" NOT NULL,
	"is_looking_for_contributors" boolean NOT NULL,
	"is_looking_for_investors" boolean NOT NULL,
	"is_hiring" boolean NOT NULL,
	"is_public" boolean NOT NULL,
	"has_been_acquired" boolean NOT NULL,
	"acquired_by" text,
	"deleted_at" timestamp,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "project_competitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" text NOT NULL,
	"alternative_competitor_type" "alternative_competitor_type" NOT NULL,
	"alternative_project_id" text,
	"alternative_competitor_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Add foreign key constraints only if they don't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'project_owner_id_user_id_fk'
    ) THEN
        ALTER TABLE "project" ADD CONSTRAINT "project_owner_id_user_id_fk"
        FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'project_acquired_by_competitor_id_fk'
    ) THEN
        ALTER TABLE "project" ADD CONSTRAINT "project_acquired_by_competitor_id_fk"
        FOREIGN KEY ("acquired_by") REFERENCES "public"."competitor"("id") ON DELETE set null ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'project_competitors_project_id_project_id_fk'
    ) THEN
        ALTER TABLE "project_competitors" ADD CONSTRAINT "project_competitors_project_id_project_id_fk"
        FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'project_competitors_alternative_project_id_project_id_fk'
    ) THEN
        ALTER TABLE "project_competitors" ADD CONSTRAINT "project_competitors_alternative_project_id_project_id_fk"
        FOREIGN KEY ("alternative_project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'project_competitors_alternative_competitor_id_competitor_id_fk'
    ) THEN
        ALTER TABLE "project_competitors" ADD CONSTRAINT "project_competitors_alternative_competitor_id_competitor_id_fk"
        FOREIGN KEY ("alternative_competitor_id") REFERENCES "public"."competitor"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
