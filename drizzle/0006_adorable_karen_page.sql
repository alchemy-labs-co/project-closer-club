CREATE TABLE "modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(255),
	"is_public" boolean DEFAULT false NOT NULL,
	"slug" varchar(255) NOT NULL,
	"course_id" uuid NOT NULL,
	"order_index" text DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "segments" RENAME TO "lessons";--> statement-breakpoint
ALTER TABLE "lessons" RENAME COLUMN "course_id" TO "module_id";--> statement-breakpoint
ALTER TABLE "lessons" DROP CONSTRAINT "segments_course_id_courses_id_fk";
--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "order_index" text DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "module_name_index" ON "modules" USING btree ("name");--> statement-breakpoint
CREATE INDEX "module_slug_index" ON "modules" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "module_course_id_index" ON "modules" USING btree ("course_id");--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "segment_module_id_index" ON "lessons" USING btree ("module_id");