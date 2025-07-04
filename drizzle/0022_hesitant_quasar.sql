ALTER TABLE "agents" DROP CONSTRAINT "agents_student_id_unique";--> statement-breakpoint
ALTER TABLE "team_leaders" DROP CONSTRAINT "team_leaders_team_leader_id_unique";--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_leaders" ADD CONSTRAINT "team_leaders_team_leader_id_user_id_fk" FOREIGN KEY ("team_leader_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;