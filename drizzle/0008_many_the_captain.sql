CREATE TABLE "lesson_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" text NOT NULL,
	"lesson_id" uuid NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_module_id_modules_id_fk";
--> statement-breakpoint
ALTER TABLE "modules" DROP CONSTRAINT "modules_course_id_courses_id_fk";
--> statement-breakpoint
ALTER TABLE "student_courses" DROP CONSTRAINT "student_courses_course_id_courses_id_fk";
--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_student_id_agents_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."agents"("student_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lesson_progress_student_id_index" ON "lesson_progress" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "lesson_progress_lesson_id_index" ON "lesson_progress" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "unique_student_lesson_progress" ON "lesson_progress" USING btree ("student_id","lesson_id");--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_courses" ADD CONSTRAINT "student_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;