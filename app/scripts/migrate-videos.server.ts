/**
 * Migration script to backfill videosTable for existing videos
 * This script finds all lessons with videoUrl but no videoId and creates
 * corresponding records in the videosTable for proper library tracking
 */

import { and, eq, isNotNull, isNull, ne } from "drizzle-orm";
import { dashboardConfig } from "~/config/dashboard";
import db from "~/db/index.server";
import { lessonsTable, videosTable } from "~/db/schema";

const BUNNY_LIBRARY_ID = dashboardConfig.libraryId || "461493";
const BUNNY_API_KEY = process.env.BUNNY_STREAM_ACCESS_KEY;

async function getVideoMetadataFromBunny(videoGuid: string) {
	try {
		const response = await fetch(
			`https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoGuid}`,
			{
				headers: {
					AccessKey: BUNNY_API_KEY || "",
				},
			},
		);

		if (!response.ok) {
			console.error(`Failed to fetch video metadata for GUID: ${videoGuid}`);
			return null;
		}

		return await response.json();
	} catch (error) {
		console.error(
			`Error fetching video metadata for GUID: ${videoGuid}`,
			error,
		);
		return null;
	}
}

export async function migrateExistingVideos() {
	console.log("🔄 Starting video migration...");

	try {
		// Find all lessons with videoUrl but no videoId
		const lessonsWithOrphanVideos = await db
			.select({
				id: lessonsTable.id,
				name: lessonsTable.name,
				description: lessonsTable.description,
				videoUrl: lessonsTable.videoUrl,
				videoId: lessonsTable.videoId,
				created_at: lessonsTable.created_at,
			})
			.from(lessonsTable)
			.where(
				and(
					isNull(lessonsTable.videoId),
					// Ensure videoUrl exists and is not empty
					isNotNull(lessonsTable.videoUrl),
					ne(lessonsTable.videoUrl, ""),
				),
			);

		console.log(
			`Found ${lessonsWithOrphanVideos.length} lessons with orphan videos`,
		);

		if (lessonsWithOrphanVideos.length === 0) {
			console.log("✅ No orphan videos found. Migration not needed.");
			return;
		}

		let successCount = 0;
		let failureCount = 0;

		for (const lesson of lessonsWithOrphanVideos) {
			const videoGuid = lesson.videoUrl;

			// Check if video already exists in videosTable
			const [existingVideo] = await db
				.select()
				.from(videosTable)
				.where(eq(videosTable.videoGuid, videoGuid));

			if (existingVideo) {
				// Video already exists, just link it to the lesson
				console.log(
					`Video ${videoGuid} already exists, linking to lesson ${lesson.id}`,
				);

				await db
					.update(lessonsTable)
					.set({
						videoId: existingVideo.id,
						updated_at: new Date(),
					})
					.where(eq(lessonsTable.id, lesson.id));

				successCount++;
				continue;
			}

			// Fetch metadata from Bunny CDN
			console.log(`Fetching metadata for video GUID: ${videoGuid}`);
			const bunnyMetadata = await getVideoMetadataFromBunny(videoGuid);

			let videoTitle = lesson.name || "Untitled Video";
			let videoDescription = lesson.description || null;
			let duration = null;
			let fileSize = null;
			let resolution = null;
			let thumbnailUrl = null;

			if (bunnyMetadata) {
				// Use Bunny metadata if available
				videoTitle = bunnyMetadata.title || lesson.name || "Untitled Video";
				videoDescription =
					bunnyMetadata.description || lesson.description || null;
				duration = bunnyMetadata.length || null; // Duration in seconds
				fileSize = bunnyMetadata.size || null; // Size in bytes

				// Extract resolution from metadata
				if (bunnyMetadata.width && bunnyMetadata.height) {
					resolution = `${bunnyMetadata.width}x${bunnyMetadata.height}`;
				}

				// Generate thumbnail URL
				if (bunnyMetadata.thumbnailFileName) {
					thumbnailUrl = `https://vz-${BUNNY_LIBRARY_ID}-461.b-cdn.net/${videoGuid}/${bunnyMetadata.thumbnailFileName}`;
				}
			}

			// Create video record in videosTable
			try {
				const [newVideo] = await db
					.insert(videosTable)
					.values({
						title: videoTitle,
						description: videoDescription,
						videoGuid: videoGuid,
						libraryId: BUNNY_LIBRARY_ID,
						thumbnailUrl,
						duration,
						fileSize,
						resolution,
						status: "ready", // Assume ready since it's already in use
						tags: null, // Can be updated manually later
						uploadedBy: null, // Unknown from migration
						createdAt: lesson.created_at || new Date(),
						updatedAt: new Date(),
					})
					.returning();

				// Update lesson with videoId reference
				await db
					.update(lessonsTable)
					.set({
						videoId: newVideo.id,
						updated_at: new Date(),
					})
					.where(eq(lessonsTable.id, lesson.id));

				console.log(
					`✅ Migrated video for lesson: ${lesson.name} (Video ID: ${newVideo.id})`,
				);
				successCount++;
			} catch (error) {
				console.error(
					`❌ Failed to migrate video for lesson: ${lesson.name}`,
					error,
				);
				failureCount++;
			}
		}

		console.log("\n📊 Migration Summary:");
		console.log(`✅ Successfully migrated: ${successCount} videos`);
		console.log(`❌ Failed migrations: ${failureCount} videos`);
		console.log(`📹 Total processed: ${lessonsWithOrphanVideos.length} videos`);

		if (failureCount === 0) {
			console.log("\n🎉 Migration completed successfully!");
		} else {
			console.log(
				"\n⚠️ Migration completed with some failures. Please review the errors above.",
			);
		}
	} catch (error) {
		console.error("❌ Migration failed:", error);
		throw error;
	}
}

// Run the migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	migrateExistingVideos()
		.then(() => {
			console.log("Migration script finished");
			process.exit(0);
		})
		.catch((error) => {
			console.error("Migration script failed:", error);
			process.exit(1);
		});
}
