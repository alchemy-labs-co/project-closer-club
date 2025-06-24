CREATE TABLE "team_leaders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_leaders_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "team_leader_id" uuid;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_team_leader_id_team_leaders_id_fk" FOREIGN KEY ("team_leader_id") REFERENCES "public"."team_leaders"("id") ON DELETE no action ON UPDATE no action;