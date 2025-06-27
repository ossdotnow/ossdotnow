-- CREATE TYPE "public"."user_role" AS ENUM('admin', 'user', 'moderator');--> statement-breakpoint
-- ALTER TABLE "user" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";--> statement-breakpoint
-- ALTER TABLE "user" ALTER COLUMN "role" SET NOT NULL;


-- Create enum type only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE "public"."user_role" AS ENUM('admin', 'user', 'moderator');
    END IF;
END $$;
--> statement-breakpoint

-- Update column type only if it's not already the correct type
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user'
        AND column_name = 'role'
        AND data_type != 'USER-DEFINED'
    ) THEN
        ALTER TABLE "user" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";
    END IF;
END $$;
--> statement-breakpoint

-- Set NOT NULL constraint only if it's not already set
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user'
        AND column_name = 'role'
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE "user" ALTER COLUMN "role" SET NOT NULL;
    END IF;
END $$;
