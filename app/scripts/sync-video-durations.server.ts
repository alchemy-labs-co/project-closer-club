import { eq } from "drizzle-orm";
import db from "~/db/index.server";
import { videosTable } from "~/db/schema";
import { getVideoDetailsFromBunny } from "~/lib/bunny.server";

/**
 * Utility script to sync video durations from Bunny.net
 * This fetches the actual duration for each video from the Bunny.net API
 */
export async function syncVideoDurations() {
	try {
		console.log("🔄 Starting video duration sync from Bunny.net...");

		// Get all videos
		const videos = await db.select().from(videosTable);

		console.log(`📊 Found ${videos.length} videos to check`);

		let updatedCount = 0;
		let errorCount = 0;

		for (const video of videos) {
			if (video.videoGuid && video.libraryId) {
				try {
					// Fetch video details from Bunny.net
					const bunnyVideo = await getVideoDetailsFromBunny(
						video.libraryId,
						video.videoGuid,
					);

					// Update video with duration and other metadata
					const updates: any = {};

					// Duration is in seconds from Bunny.net
					if (bunnyVideo.length && bunnyVideo.length > 0) {
						updates.duration = bunnyVideo.length;
					}

					// Update file size if available
					if (bunnyVideo.storageSize && bunnyVideo.storageSize > 0) {
						updates.fileSize = bunnyVideo.storageSize;
					}

					// Update resolution if available
					if (bunnyVideo.width && bunnyVideo.height) {
						updates.resolution = `${bunnyVideo.width}x${bunnyVideo.height}`;
					}

					// Update status based on Bunny's status
					// Status codes: 0 = Queued, 1 = Processing, 2 = Encoding, 3 = Finished, 4 = Resolution Finished, 5 = Failed
					if (bunnyVideo.status === 3 || bunnyVideo.status === 4) {
						updates.status = "ready";
					} else if (bunnyVideo.status === 5) {
						updates.status = "failed";
					} else if (bunnyVideo.status < 3) {
						updates.status = "processing";
					}

					// Only update if we have changes
					if (Object.keys(updates).length > 0) {
						updates.updatedAt = new Date();

						await db
							.update(videosTable)
							.set(updates)
							.where(eq(videosTable.id, video.id));

						updatedCount++;
						console.log(
							`✅ Updated video: ${video.title} - Duration: ${updates.duration || "N/A"}s, Size: ${updates.fileSize ? (updates.fileSize / (1024 * 1024)).toFixed(2) + "MB" : "N/A"}`,
						);
					} else {
						console.log(`⏭️ No updates needed for: ${video.title}`);
					}
				} catch (error) {
					errorCount++;
					console.error(
						`❌ Failed to sync video ${video.title} (${video.videoGuid}):`,
						error instanceof Error ? error.message : error,
					);
				}
			} else {
				console.warn(
					`⚠️ Skipping video ${video.id} - missing videoGuid or libraryId`,
				);
			}
		}

		console.log(
			`🎉 Sync completed! Updated ${updatedCount} videos, ${errorCount} errors`,
		);

		return {
			success: true,
			total: videos.length,
			updated: updatedCount,
			errors: errorCount,
		};
	} catch (error) {
		console.error("🔴 Error syncing video durations:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

/**
 * CLI function to run the sync
 * Usage: bun run app/scripts/sync-video-durations.server.ts
 */
if (require.main === module) {
	syncVideoDurations()
		.then((result) => {
			if (result.success) {
				console.log(
					`✅ Duration sync completed successfully! Updated ${result.updated} videos`,
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
