-- CREATE TYPE "public"."project_approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
-- -- ALTER TABLE "competitor" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint

-- -- 1. Drop the foreign key constraints before type changes
-- ALTER TABLE "project" DROP CONSTRAINT IF EXISTS "project_acquired_by_competitor_id_fk";
-- ALTER TABLE "project_competitors" DROP CONSTRAINT IF EXISTS "project_competitors_alternative_competitor_id_competitor_id_fk";
-- ALTER TABLE "project_competitors" DROP CONSTRAINT IF EXISTS "project_competitors_project_id_project_id_fk";
-- ALTER TABLE "project_competitors" DROP CONSTRAINT IF EXISTS "project_competitors_alternative_project_id_project_id_fk";

-- -- 2. Change the column types (with USING ...::uuid)
-- ALTER TABLE "competitor" ALTER COLUMN "id" SET DATA TYPE uuid USING id::uuid;
-- ALTER TABLE "competitor" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- ALTER TABLE "project" ALTER COLUMN "id" SET DATA TYPE uuid USING id::uuid;
-- ALTER TABLE "project" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
-- ALTER TABLE "project" ALTER COLUMN "tags" SET DEFAULT '{}';
-- ALTER TABLE "project" ALTER COLUMN "acquired_by" SET DATA TYPE uuid USING acquired_by::uuid;
-- ALTER TABLE "project" ALTER COLUMN "created_at" SET DEFAULT now();
-- ALTER TABLE "project" ALTER COLUMN "updated_at" SET DEFAULT now();

-- ALTER TABLE "project_competitors" ALTER COLUMN "project_id" SET DATA TYPE uuid USING project_id::uuid;
-- ALTER TABLE "project_competitors" ALTER COLUMN "alternative_project_id" SET DATA TYPE uuid USING alternative_project_id::uuid;
-- ALTER TABLE "project_competitors" ALTER COLUMN "alternative_competitor_id" SET DATA TYPE uuid USING alternative_competitor_id::uuid;

-- ALTER TABLE "project" ADD COLUMN "approval_status" "project_approval_status" DEFAULT 'pending' NOT NULL;
-- CREATE INDEX "project_competitors_project_id_idx" ON "project_competitors" USING btree ("project_id");
-- CREATE INDEX "project_competitors_alt_project_id_idx" ON "project_competitors" USING btree ("alternative_project_id");
-- CREATE INDEX "project_competitors_alt_competitor_id_idx" ON "project_competitors" USING btree ("alternative_competitor_id");

-- -- 3. Re-add the foreign key constraints after type changes
-- ALTER TABLE "project" ADD CONSTRAINT "project_acquired_by_competitor_id_fk" FOREIGN KEY ("acquired_by") REFERENCES "competitor"("id") ON DELETE SET NULL;
-- ALTER TABLE "project_competitors" ADD CONSTRAINT "project_competitors_alternative_competitor_id_competitor_id_fk" FOREIGN KEY ("alternative_competitor_id") REFERENCES "competitor"("id") ON DELETE CASCADE;
-- ALTER TABLE "project_competitors" ADD CONSTRAINT "project_competitors_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE;
-- ALTER TABLE "project_competitors" ADD CONSTRAINT "project_competitors_alternative_project_id_project_id_fk" FOREIGN KEY ("alternative_project_id") REFERENCES "project"("id") ON DELETE CASCADE;

-- Create enum type with conditional check
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_approval_status') THEN
        CREATE TYPE "public"."project_approval_status" AS ENUM('pending', 'approved', 'rejected');
    END IF;
END $$;
--> statement-breakpoint

-- 1. Drop the foreign key constraints before type changes (only if they exist)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'project_acquired_by_competitor_id_fk'
    ) THEN
        ALTER TABLE "project" DROP CONSTRAINT "project_acquired_by_competitor_id_fk";
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'project_competitors_alternative_competitor_id_competitor_id_fk'
    ) THEN
        ALTER TABLE "project_competitors" DROP CONSTRAINT "project_competitors_alternative_competitor_id_competitor_id_fk";
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'project_competitors_project_id_project_id_fk'
    ) THEN
        ALTER TABLE "project_competitors" DROP CONSTRAINT "project_competitors_project_id_project_id_fk";
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'project_competitors_alternative_project_id_project_id_fk'
    ) THEN
        ALTER TABLE "project_competitors" DROP CONSTRAINT "project_competitors_alternative_project_id_project_id_fk";
    END IF;
END $$;
--> statement-breakpoint

-- 2. Change the column types (with USING ...::uuid) only if not already UUID
DO $$
BEGIN
    -- Check if competitor.id is not already UUID
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'competitor' AND column_name = 'id' AND data_type != 'uuid'
    ) THEN
        ALTER TABLE "competitor" ALTER COLUMN "id" SET DATA TYPE uuid USING id::uuid;
        ALTER TABLE "competitor" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
    END IF;
END $$;

DO $$
BEGIN
    -- Check if project.id is not already UUID
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project' AND column_name = 'id' AND data_type != 'uuid'
    ) THEN
        ALTER TABLE "project" ALTER COLUMN "id" SET DATA TYPE uuid USING id::uuid;
        ALTER TABLE "project" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
    END IF;
END $$;

-- Set defaults only if they don't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project' AND column_name = 'tags' AND column_default = '{}'
    ) THEN
        ALTER TABLE "project" ALTER COLUMN "tags" SET DEFAULT '{}';
    END IF;
END $$;

DO $$
BEGIN
    -- Check if acquired_by is not already UUID
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project' AND column_name = 'acquired_by' AND data_type != 'uuid'
    ) THEN
        ALTER TABLE "project" ALTER COLUMN "acquired_by" SET DATA TYPE uuid USING acquired_by::uuid;
    END IF;
END $$;

-- Set timestamp defaults
ALTER TABLE "project" ALTER COLUMN "created_at" SET DEFAULT now();
ALTER TABLE "project" ALTER COLUMN "updated_at" SET DEFAULT now();

-- Update project_competitors table columns to UUID
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project_competitors' AND column_name = 'project_id' AND data_type != 'uuid'
    ) THEN
        ALTER TABLE "project_competitors" ALTER COLUMN "project_id" SET DATA TYPE uuid USING project_id::uuid;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project_competitors' AND column_name = 'alternative_project_id' AND data_type != 'uuid'
    ) THEN
        ALTER TABLE "project_competitors" ALTER COLUMN "alternative_project_id" SET DATA TYPE uuid USING alternative_project_id::uuid;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project_competitors' AND column_name = 'alternative_competitor_id' AND data_type != 'uuid'
    ) THEN
        ALTER TABLE "project_competitors" ALTER COLUMN "alternative_competitor_id" SET DATA TYPE uuid USING alternative_competitor_id::uuid;
    END IF;
END $$;
--> statement-breakpoint

-- Add approval_status column only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project' AND column_name = 'approval_status'
    ) THEN
        ALTER TABLE "project" ADD COLUMN "approval_status" "project_approval_status" DEFAULT 'pending' NOT NULL;
    END IF;
END $$;
--> statement-breakpoint

-- Create indexes only if they don't exist
CREATE INDEX IF NOT EXISTS "project_competitors_project_id_idx" ON "project_competitors" USING btree ("project_id");
CREATE INDEX IF NOT EXISTS "project_competitors_alt_project_id_idx" ON "project_competitors" USING btree ("alternative_project_id");
CREATE INDEX IF NOT EXISTS "project_competitors_alt_competitor_id_idx" ON "project_competitors" USING btree ("alternative_competitor_id");
--> statement-breakpoint

-- 3. Re-add the foreign key constraints after type changes (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'project_acquired_by_competitor_id_fk'
    ) THEN
        ALTER TABLE "project" ADD CONSTRAINT "project_acquired_by_competitor_id_fk"
        FOREIGN KEY ("acquired_by") REFERENCES "competitor"("id") ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'project_competitors_alternative_competitor_id_competitor_id_fk'
    ) THEN
        ALTER TABLE "project_competitors" ADD CONSTRAINT "project_competitors_alternative_competitor_id_competitor_id_fk"
        FOREIGN KEY ("alternative_competitor_id") REFERENCES "competitor"("id") ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'project_competitors_project_id_project_id_fk'
    ) THEN
        ALTER TABLE "project_competitors" ADD CONSTRAINT "project_competitors_project_id_project_id_fk"
        FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'project_competitors_alternative_project_id_project_id_fk'
    ) THEN
        ALTER TABLE "project_competitors" ADD CONSTRAINT "project_competitors_alternative_project_id_project_id_fk"
        FOREIGN KEY ("alternative_project_id") REFERENCES "project"("id") ON DELETE CASCADE;
    END IF;
END $$;
