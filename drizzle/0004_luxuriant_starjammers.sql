ALTER TABLE "team_leaders" ADD COLUMN "team_leader_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "team_leaders" ADD CONSTRAINT "team_leaders_team_leader_id_unique" UNIQUE("team_leader_id");