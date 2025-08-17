import { isNull, eq } from "drizzle-orm";
import db from "~/db/index.server";
import { videosTable } from "~/db/schema";
import { getVideoThumbnailUrl } from "~/lib/bunny.server";

/**
 * Utility script to update existing videos that don't have thumbnail URLs
 * This script will find all videos with null thumbnailUrl and generate them
 * based on the videoGuid and libraryId.
 */
export async function syncVideoThumbnails() {
	try {
		console.log("🔄 Starting video thumbnail sync...");

		// Find all videos without thumbnail URLs
		const videosWithoutThumbnails = await db
			.select()
			.from(videosTable)
			.where(isNull(videosTable.thumbnailUrl));

		console.log(
			`📊 Found ${videosWithoutThumbnails.length} videos without thumbnail URLs`,
		);

		if (videosWithoutThumbnails.length === 0) {
			console.log("✅ All videos already have thumbnail URLs");
			return { success: true, updated: 0 };
		}

		let updatedCount = 0;

		for (const video of videosWithoutThumbnails) {
			if (video.videoGuid && video.libraryId) {
				try {
					// Generate thumbnail URL using the same pattern as new uploads
					const thumbnailUrl = getVideoThumbnailUrl(
						video.libraryId,
						video.videoGuid,
					);

					// Update the video record
					await db
						.update(videosTable)
						.set({
							thumbnailUrl,
							updatedAt: new Date(),
						})
						.where(eq(videosTable.id, video.id));

					updatedCount++;
					console.log(
						`✅ Updated thumbnail for video: ${video.title} (${video.videoGuid})`,
					);
				} catch (error) {
					console.error(`❌ Failed to update video ${video.id}:`, error);
				}
			} else {
				console.warn(
					`⚠️ Skipping video ${video.id} - missing videoGuid or libraryId`,
				);
			}
		}

		console.log(
			`🎉 Sync completed! Updated ${updatedCount} out of ${videosWithoutThumbnails.length} videos`,
		);

		return {
			success: true,
			total: videosWithoutThumbnails.length,
			updated: updatedCount,
		};
	} catch (error) {
		console.error("🔴 Error syncing video thumbnails:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

/**
 * CLI function to run the sync
 * Usage: bun run app/scripts/sync-video-thumbnails.server.ts
 */
if (require.main === module) {
	syncVideoThumbnails()
		.then((result) => {
			if (result.success) {
				console.log(
					`✅ Sync completed successfully! Updated ${result.updated} videos`,
				);
				process.exit(0);
			} else {
				console.error(`❌ Sync failed: ${result.error}`);
				process.exit(1);
			}
		})
		.catch((error) => {
			console.error("❌ Script execution failed:", error);
			process.exit(1);
		});
}
