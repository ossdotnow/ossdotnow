CREATE TABLE "project_launch" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"tagline" text NOT NULL,
	"detailed_description" text,
	"launch_date" timestamp with time zone DEFAULT now() NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_launch_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "project_vote" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_vote_project_id_user_id_unique" UNIQUE("project_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "project_comment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"parent_id" uuid,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_launch" ADD CONSTRAINT "project_launch_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_vote" ADD CONSTRAINT "project_vote_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_vote" ADD CONSTRAINT "project_vote_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_comment" ADD CONSTRAINT "project_comment_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_comment" ADD CONSTRAINT "project_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_comment" ADD CONSTRAINT "project_comment_parent_id_project_comment_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."project_comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_launch_project_id_idx" ON "project_launch" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_launch_launch_date_idx" ON "project_launch" USING btree ("launch_date");--> statement-breakpoint
CREATE INDEX "project_vote_project_id_idx" ON "project_vote" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_vote_user_id_idx" ON "project_vote" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "project_comment_project_id_idx" ON "project_comment" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_comment_user_id_idx" ON "project_comment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "project_comment_parent_id_idx" ON "project_comment" USING btree ("parent_id");