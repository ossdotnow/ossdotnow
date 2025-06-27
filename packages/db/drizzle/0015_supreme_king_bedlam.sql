CREATE TABLE "competitor_tag_relations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"competitor_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "status_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "type_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "competitor_tag_relations" ADD CONSTRAINT "competitor_tag_relations_competitor_id_competitor_id_fk" FOREIGN KEY ("competitor_id") REFERENCES "public"."competitor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_tag_relations" ADD CONSTRAINT "competitor_tag_relations_tag_id_category_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."category_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "competitor_tag_relations_competitor_id_idx" ON "competitor_tag_relations" USING btree ("competitor_id");--> statement-breakpoint
CREATE INDEX "competitor_tag_relations_tag_id_idx" ON "competitor_tag_relations" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "unique_competitor_tag" ON "competitor_tag_relations" USING btree ("competitor_id","tag_id");--> statement-breakpoint
ALTER TABLE "competitor" DROP COLUMN "tags";--> statement-breakpoint
DROP TYPE "public"."project_status";--> statement-breakpoint
DROP TYPE "public"."project_type";--> statement-breakpoint
DROP TYPE "public"."tags";
