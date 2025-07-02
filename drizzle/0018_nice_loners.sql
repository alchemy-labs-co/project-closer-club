CREATE TABLE "lead_capture" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone_number" varchar(255),
	"state_of_residence" varchar(255),
	"are_you_over_18" boolean NOT NULL,
	"do_you_have_any_felonies_or_misdemeanors" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);