-- ALTER TABLE "project" ALTER COLUMN "git_repo_url" SET NOT NULL;--> statement-breakpoint
-- ALTER TABLE "project" ADD CONSTRAINT "project_git_repo_url_unique" UNIQUE("git_repo_url");


-- Set NOT NULL constraint only if the column is currently nullable
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project'
        AND column_name = 'git_repo_url'
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE "project" ALTER COLUMN "git_repo_url" SET NOT NULL;
    END IF;
END $$;
--> statement-breakpoint

-- Add unique constraint only if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'project_git_repo_url_unique'
        AND table_name = 'project'
    ) THEN
        ALTER TABLE "project" ADD CONSTRAINT "project_git_repo_url_unique" UNIQUE("git_repo_url");
    END IF;
END $$;
