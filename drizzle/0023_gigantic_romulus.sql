CREATE TABLE "videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"video_guid" varchar(255) NOT NULL,
	"thumbnail_url" varchar(500),
	"duration" integer,
	"tags" text,
	"uploaded_by" text,
	"library_id" varchar(100) NOT NULL,
	"file_size" bigint,
	"resolution" varchar(20),
	"status" varchar(50) DEFAULT 'processing' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "videos_video_guid_unique" UNIQUE("video_guid")
);
--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "video_id" uuid;--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "video_title_index" ON "videos" USING btree ("title");--> statement-breakpoint
CREATE INDEX "video_created_at_index" ON "videos" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "video_guid_index" ON "videos" USING btree ("video_guid");--> statement-breakpoint
CREATE INDEX "video_status_index" ON "videos" USING btree ("status");--> statement-breakpoint
CREATE INDEX "video_uploaded_by_index" ON "videos" USING btree ("uploaded_by");--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "segment_video_id_index" ON "lessons" USING btree ("video_id");