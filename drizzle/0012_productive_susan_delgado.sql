ALTER TABLE "quiz_assignments" RENAME TO "completed_quiz_assignments";--> statement-breakpoint
ALTER TABLE "completed_quiz_assignments" DROP CONSTRAINT "quiz_assignments_quiz_id_quizzes_id_fk";
--> statement-breakpoint
ALTER TABLE "completed_quiz_assignments" DROP CONSTRAINT "quiz_assignments_lesson_id_lessons_id_fk";
--> statement-breakpoint
ALTER TABLE "completed_quiz_assignments" ADD CONSTRAINT "completed_quiz_assignments_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "completed_quiz_assignments" ADD CONSTRAINT "completed_quiz_assignments_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;