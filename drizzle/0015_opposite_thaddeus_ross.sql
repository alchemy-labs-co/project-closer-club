ALTER TABLE "lessons" ALTER COLUMN "order_index" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "modules" ALTER COLUMN "order_index" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "order_index" text DEFAULT '0' NOT NULL;