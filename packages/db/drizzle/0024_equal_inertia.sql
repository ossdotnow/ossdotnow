-- Add repo_id column as integer (GitHub repository IDs are integers)
-- This column might not exist yet or might exist as text from previous attempts
-- We'll drop it if it exists and recreate it as integer
ALTER TABLE "project" DROP COLUMN IF EXISTS "repo_id";
ALTER TABLE "project" ADD COLUMN "repo_id" integer NOT NULL DEFAULT 0;
