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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
-- CREATE TABLE "project_report" (
-- 	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
-- 	"project_id" uuid NOT NULL,
-- 	"user_id" text NOT NULL,
-- 	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
-- 	CONSTRAINT "project_report_project_id_user_id_unique" UNIQUE("project_id","user_id")
-- );
-- --> statement-breakpoint
-- ALTER TABLE "project_report" ADD CONSTRAINT "project_report_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- ALTER TABLE "project_report" ADD CONSTRAINT "project_report_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- CREATE INDEX "project_report_project_id_idx" ON "project_report" USING btree ("project_id");--> statement-breakpoint
-- CREATE INDEX "project_report_user_id_idx" ON "project_report" USING btree ("user_id");

-- Create table with IF NOT EXISTS to prevent conflicts
CREATE TABLE IF NOT EXISTS "project_report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_report_project_id_user_id_unique" UNIQUE("project_id","user_id")
);
--> statement-breakpoint

-- Add foreign key constraints only if they don't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'project_report_project_id_project_id_fk'
    ) THEN
        ALTER TABLE "project_report" ADD CONSTRAINT "project_report_project_id_project_id_fk"
        FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'project_report_user_id_user_id_fk'
    ) THEN
        ALTER TABLE "project_report" ADD CONSTRAINT "project_report_user_id_user_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint

-- Create indexes with IF NOT EXISTS to prevent conflicts
CREATE INDEX IF NOT EXISTS "project_report_project_id_idx" ON "project_report" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project_report_user_id_idx" ON "project_report" USING btree ("user_id");
