CREATE TABLE "project_tag_relations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "status_id" uuid;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "type_id" uuid;--> statement-breakpoint
ALTER TABLE "project_tag_relations" ADD CONSTRAINT "project_tag_relations_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tag_relations" ADD CONSTRAINT "project_tag_relations_tag_id_category_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."category_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_tag_relations_project_id_idx" ON "project_tag_relations" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_tag_relations_tag_id_idx" ON "project_tag_relations" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "unique_project_tag" ON "project_tag_relations" USING btree ("project_id","tag_id");--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_status_id_category_project_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."category_project_statuses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_type_id_category_project_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."category_project_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_status_id_idx" ON "project" USING btree ("status_id");--> statement-breakpoint
CREATE INDEX "project_type_id_idx" ON "project" USING btree ("type_id");