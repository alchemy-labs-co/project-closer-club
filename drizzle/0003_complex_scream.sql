-- Drop dependent foreign key constraints first
ALTER TABLE "student_courses" DROP CONSTRAINT "student_courses_student_id_students_student_id_fk";--> statement-breakpoint

-- Drop unique constraints
ALTER TABLE "students" DROP CONSTRAINT "students_student_id_unique";--> statement-breakpoint
ALTER TABLE "students" DROP CONSTRAINT "students_email_unique";--> statement-breakpoint

-- Drop the team leader foreign key constraint if it exists
ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "students_team_leader_id_team_leaders_id_fk";--> statement-breakpoint

-- Rename the table
ALTER TABLE "students" RENAME TO "agents";--> statement-breakpoint

-- Add back the unique constraints with new names
ALTER TABLE "agents" ADD CONSTRAINT "agents_student_id_unique" UNIQUE("student_id");--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_email_unique" UNIQUE("email");--> statement-breakpoint

-- Add back the foreign key constraints
ALTER TABLE "student_courses" ADD CONSTRAINT "student_courses_student_id_agents_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."agents"("student_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_team_leader_id_team_leaders_id_fk" FOREIGN KEY ("team_leader_id") REFERENCES "public"."team_leaders"("id") ON DELETE no action ON UPDATE no action;