-- CREATE TABLE "project_claim" (
-- 	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
-- 	"project_id" uuid NOT NULL,
-- 	"user_id" text NOT NULL,
-- 	"success" boolean NOT NULL,
-- 	"verification_method" text NOT NULL,
-- 	"verification_details" jsonb,
-- 	"error_reason" text,
-- 	"created_at" timestamp with time zone DEFAULT now() NOT NULL
-- );
-- --> statement-breakpoint
-- CREATE TABLE "category_project_statuses" (
-- 	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
-- 	"name" text NOT NULL,
-- 	"display_name" text NOT NULL,
-- 	"is_active" boolean DEFAULT true NOT NULL,
-- 	"sort_order" integer DEFAULT 0 NOT NULL,
-- 	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
-- 	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
-- 	CONSTRAINT "category_project_statuses_name_unique" UNIQUE("name")
-- );
-- --> statement-breakpoint
-- CREATE TABLE "category_project_types" (
-- 	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
-- 	"name" text NOT NULL,
-- 	"display_name" text NOT NULL,
-- 	"is_active" boolean DEFAULT true NOT NULL,
-- 	"sort_order" integer DEFAULT 0 NOT NULL,
-- 	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
-- 	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
-- 	CONSTRAINT "category_project_types_name_unique" UNIQUE("name")
-- );
-- --> statement-breakpoint
-- CREATE TABLE "category_tags" (
-- 	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
-- 	"name" text NOT NULL,
-- 	"display_name" text NOT NULL,
-- 	"is_active" boolean DEFAULT true NOT NULL,
-- 	"sort_order" integer DEFAULT 0 NOT NULL,
-- 	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
-- 	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
-- 	CONSTRAINT "category_tags_name_unique" UNIQUE("name")
-- );
-- --> statement-breakpoint

-- ALTER TABLE "project" ADD COLUMN "is_pinned" boolean DEFAULT false NOT NULL;
-- ALTER TABLE "project_claim" ADD CONSTRAINT "project_claim_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- ALTER TABLE "project_claim" ADD CONSTRAINT "project_claim_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;


-- Create project_claim table with IF NOT EXISTS
CREATE TABLE IF NOT EXISTS "project_claim" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"success" boolean NOT NULL,
	"verification_method" text NOT NULL,
	"verification_details" jsonb,
	"error_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create lookup tables with IF NOT EXISTS
CREATE TABLE IF NOT EXISTS "category_project_statuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "category_project_statuses_name_unique" UNIQUE("name")
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "category_project_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "category_project_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "category_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "category_tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint

-- Add column only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project'
        AND column_name = 'is_pinned'
    ) THEN
        ALTER TABLE "project" ADD COLUMN "is_pinned" boolean DEFAULT false NOT NULL;
    END IF;
END $$;
--> statement-breakpoint

-- Add foreign key constraints only if they don't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'project_claim_project_id_project_id_fk'
    ) THEN
        ALTER TABLE "project_claim" ADD CONSTRAINT "project_claim_project_id_project_id_fk"
        FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'project_claim_user_id_user_id_fk'
    ) THEN
        ALTER TABLE "project_claim" ADD CONSTRAINT "project_claim_user_id_user_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
