CREATE TYPE "user_role" AS ENUM ('user', 'moderator', 'admin');
ALTER TABLE "user" ADD COLUMN "role" "user_role" DEFAULT 'user' NOT NULL;
