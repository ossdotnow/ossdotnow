-- ALTER TYPE "public"."tags" ADD VALUE 'dapp';--> statement-breakpoint
-- ALTER TYPE "public"."tags" ADD VALUE 'saas';--> statement-breakpoint
-- ALTER TYPE "public"."tags" ADD VALUE 'algorithm';--> statement-breakpoint
-- ALTER TYPE "public"."tags" ADD VALUE 'data-analysis';--> statement-breakpoint
-- ALTER TYPE "public"."tags" ADD VALUE 'game-engine';--> statement-breakpoint
-- ALTER TABLE "project" ALTER COLUMN "is_looking_for_contributors" SET DEFAULT false;--> statement-breakpoint
-- ALTER TABLE "project" ALTER COLUMN "is_looking_for_investors" SET DEFAULT false;--> statement-breakpoint
-- ALTER TABLE "project" ALTER COLUMN "is_hiring" SET DEFAULT false;--> statement-breakpoint
-- ALTER TABLE "project" ALTER COLUMN "is_public" SET DEFAULT false;--> statement-breakpoint
-- ALTER TABLE "project" ALTER COLUMN "has_been_acquired" SET DEFAULT false;--> statement-breakpoint
-- ALTER TABLE "session" ADD COLUMN "impersonated_by" text;--> statement-breakpoint
-- ALTER TABLE "user" ADD COLUMN "role" text;--> statement-breakpoint
-- ALTER TABLE "user" ADD COLUMN "banned" boolean;--> statement-breakpoint
-- ALTER TABLE "user" ADD COLUMN "ban_reason" text;--> statement-breakpoint
-- ALTER TABLE "user" ADD COLUMN "ban_expires" timestamp;
-- CREATE TYPE "user_role" AS ENUM ('user', 'moderator', 'admin');
-- ALTER TABLE "user" ADD COLUMN "role" "user_role" DEFAULT 'user' NOT NULL;


-- Add new values to tags enum only if they don't already exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'dapp' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'tags')) THEN
        ALTER TYPE "public"."tags" ADD VALUE 'dapp';
    END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'saas' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'tags')) THEN
        ALTER TYPE "public"."tags" ADD VALUE 'saas';
    END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'algorithm' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'tags')) THEN
        ALTER TYPE "public"."tags" ADD VALUE 'algorithm';
    END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'data-analysis' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'tags')) THEN
        ALTER TYPE "public"."tags" ADD VALUE 'data-analysis';
    END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'game-engine' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'tags')) THEN
        ALTER TYPE "public"."tags" ADD VALUE 'game-engine';
    END IF;
END $$;
--> statement-breakpoint

-- Set column defaults only if they don't already have the desired default
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project' AND column_name = 'is_looking_for_contributors'
        AND column_default = 'false'
    ) THEN
        ALTER TABLE "project" ALTER COLUMN "is_looking_for_contributors" SET DEFAULT false;
    END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project' AND column_name = 'is_looking_for_investors'
        AND column_default = 'false'
    ) THEN
        ALTER TABLE "project" ALTER COLUMN "is_looking_for_investors" SET DEFAULT false;
    END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project' AND column_name = 'is_hiring'
        AND column_default = 'false'
    ) THEN
        ALTER TABLE "project" ALTER COLUMN "is_hiring" SET DEFAULT false;
    END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project' AND column_name = 'is_public'
        AND column_default = 'false'
    ) THEN
        ALTER TABLE "project" ALTER COLUMN "is_public" SET DEFAULT false;
    END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project' AND column_name = 'has_been_acquired'
        AND column_default = 'false'
    ) THEN
        ALTER TABLE "project" ALTER COLUMN "has_been_acquired" SET DEFAULT false;
    END IF;
END $$;
--> statement-breakpoint

-- Add columns only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'session' AND column_name = 'impersonated_by'
    ) THEN
        ALTER TABLE "session" ADD COLUMN "impersonated_by" text;
    END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user' AND column_name = 'banned'
    ) THEN
        ALTER TABLE "user" ADD COLUMN "banned" boolean;
    END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user' AND column_name = 'ban_reason'
    ) THEN
        ALTER TABLE "user" ADD COLUMN "ban_reason" text;
    END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user' AND column_name = 'ban_expires'
    ) THEN
        ALTER TABLE "user" ADD COLUMN "ban_expires" timestamp;
    END IF;
END $$;
--> statement-breakpoint

-- Create user_role enum only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE "user_role" AS ENUM ('user', 'moderator', 'admin');
    END IF;
END $$;
--> statement-breakpoint

-- Handle the role column carefully since it appears twice in the original migration
DO $$
BEGIN
    -- First, check if role column exists as text type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user' AND column_name = 'role' AND data_type = 'text'
    ) THEN
        -- Convert existing text role column to user_role enum
        ALTER TABLE "user" ALTER COLUMN "role" TYPE "user_role" USING "role"::"user_role";
        ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'user';
        ALTER TABLE "user" ALTER COLUMN "role" SET NOT NULL;
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user' AND column_name = 'role'
    ) THEN
        -- Add role column if it doesn't exist at all
        ALTER TABLE "user" ADD COLUMN "role" "user_role" DEFAULT 'user' NOT NULL;
    END IF;
END $$;
