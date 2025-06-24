ALTER TABLE "project" ALTER COLUMN "git_repo_url" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_git_repo_url_unique" UNIQUE("git_repo_url");