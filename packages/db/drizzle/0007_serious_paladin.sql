-- CREATE TYPE "public"."project_provider" AS ENUM('github', 'gitlab');--> statement-breakpoint
-- ALTER TABLE "user" ALTER COLUMN "image" SET NOT NULL;--> statement-breakpoint
-- ALTER TABLE "user" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
-- ALTER TABLE "user" ALTER COLUMN "role" DROP NOT NULL;--> statement-breakpoint
-- ALTER TABLE "user" ADD COLUMN "username" text NOT NULL;

-- Create enum type only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_provider') THEN
        CREATE TYPE "public"."project_provider" AS ENUM('github', 'gitlab');
    END IF;
END $$;
--> statement-breakpoint

-- Set image column to NOT NULL only if it's currently nullable
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user'
        AND column_name = 'image'
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE "user" ALTER COLUMN "image" SET NOT NULL;
    END IF;
END $$;
--> statement-breakpoint

-- Change role column to text type only if it's not already text
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user'
        AND column_name = 'role'
        AND data_type != 'text'
    ) THEN
        ALTER TABLE "user" ALTER COLUMN "role" SET DATA TYPE text;
    END IF;
END $$;
--> statement-breakpoint

-- Drop NOT NULL constraint on role only if it currently has NOT NULL
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user'
        AND column_name = 'role'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE "user" ALTER COLUMN "role" DROP NOT NULL;
    END IF;
END $$;
--> statement-breakpoint

-- Add username column only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user'
        AND column_name = 'username'
    ) THEN
        ALTER TABLE "user" ADD COLUMN "username" text NOT NULL;
    END IF;
END $$;

