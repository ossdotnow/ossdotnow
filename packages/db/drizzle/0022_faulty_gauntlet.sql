CREATE TYPE "public"."contrib_provider" AS ENUM('github', 'gitlab');--> statement-breakpoint
CREATE TABLE "contrib_daily" (
	"user_id" uuid NOT NULL,
	"provider" "contrib_provider" NOT NULL,
	"date_utc" date NOT NULL,
	"commits" integer DEFAULT 0 NOT NULL,
	"prs" integer DEFAULT 0 NOT NULL,
	"issues" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contrib_totals" (
	"user_id" uuid NOT NULL,
	"provider" "contrib_provider" NOT NULL,
	"all_time" integer DEFAULT 0 NOT NULL,
	"last_30d" integer DEFAULT 0 NOT NULL,
	"last_365d" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "contrib_daily_user_prov_day_uidx" ON "contrib_daily" USING btree ("user_id","provider","date_utc");--> statement-breakpoint
CREATE INDEX "contrib_daily_provider_day_idx" ON "contrib_daily" USING btree ("provider","date_utc");--> statement-breakpoint
CREATE INDEX "contrib_daily_user_day_idx" ON "contrib_daily" USING btree ("user_id","date_utc");--> statement-breakpoint
CREATE UNIQUE INDEX "contrib_totals_user_prov_uidx" ON "contrib_totals" USING btree ("user_id","provider");--> statement-breakpoint
CREATE INDEX "contrib_totals_user_idx" ON "contrib_totals" USING btree ("user_id");