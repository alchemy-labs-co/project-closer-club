import { eq } from "drizzle-orm";
import { data } from "react-router";
import db from "~/db/index.server";
import { videosTable, lessonsTable } from "~/db/schema";
import { isAdminLoggedIn } from "~/lib/auth/auth.server";
import {
	createAndUploadVideoToBunnyStream,
	generateVideoUploadToken,
	confirmVideoUpload,
	deleteVideoFromBunnyStream,
	getVideoThumbnailUrl,
} from "~/lib/bunny.server";
const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID || "461493";
import type {
	UploadVideoSchema,
	UpdateVideoSchema,
	DeleteVideoSchema,
} from "~/lib/zod-schemas/video";

export async function uploadVideoToLibrary(
	request: Request,
	formData: FormData,
) {
	try {
		const { isLoggedIn, admin } = await isAdminLoggedIn(request);
		if (!isLoggedIn || !admin) {
			return data({ success: false, message: "Unauthorized" }, { status: 401 });
		}

		const title = formData.get("title") as string;
		const description = formData.get("description") as string;
		const tags = formData.get("tags") as string;
		const videoFile = formData.get("videoFile") as File;

		if (!videoFile || videoFile.size === 0) {
			return data(
				{ success: false, message: "Video file is required" },
				{ status: 400 },
			);
		}

		// Upload video to Bunny Stream
		const videoGuid = await createAndUploadVideoToBunnyStream(
			videoFile,
			title,
			BUNNY_LIBRARY_ID,
		);

		// Generate thumbnail URL
		const thumbnailUrl = getVideoThumbnailUrl(BUNNY_LIBRARY_ID, videoGuid);

		// Create video record in database
		const [video] = await db
			.insert(videosTable)
			.values({
				title,
				description: description || null,
				tags: tags || null,
				videoGuid,
				libraryId: BUNNY_LIBRARY_ID,
				thumbnailUrl,
				uploadedBy: admin.id,
				status: "processing",
				fileSize: videoFile.size,
			})
			.returning();

		return data({
			success: true,
			message: "Video uploaded successfully",
			video,
		});
	} catch (error) {
		console.error("Error uploading video:", error);
		return data(
			{
				success: false,
				message:
					error instanceof Error ? error.message : "Failed to upload video",
			},
			{ status: 500 },
		);
	}
}

export async function updateVideoMetadata(
	request: Request,
	data: UpdateVideoSchema,
) {
	try {
		const { isLoggedIn } = await isAdminLoggedIn(request);
		if (!isLoggedIn) {
			return { success: false, message: "Unauthorized" };
		}

		const { videoId, ...updateData } = data;

		const [updatedVideo] = await db
			.update(videosTable)
			.set({
				...updateData,
				updatedAt: new Date(),
			})
			.where(eq(videosTable.id, videoId))
			.returning();

		if (!updatedVideo) {
			return { success: false, message: "Video not found" };
		}

		return {
			success: true,
			message: "Video updated successfully",
			video: updatedVideo,
		};
	} catch (error) {
		console.error("Error updating video:", error);
		return { success: false, message: "Failed to update video" };
	}
}

export async function deleteVideo(request: Request, videoId: string) {
	try {
		const { isLoggedIn } = await isAdminLoggedIn(request);
		if (!isLoggedIn) {
			return { success: false, message: "Unauthorized" };
		}

		// Check if video is being used in any lessons
		const [{ count }] = await db
			.select({ count: sql<number>`count(*)` })
			.from(lessonsTable)
			.where(eq(lessonsTable.videoId, videoId));

		if (Number(count) > 0) {
			return {
				success: false,
				message: `This video is being used in ${count} lesson(s). Please remove it from all lessons before deleting.`,
				usageCount: Number(count),
			};
		}

		// Get video details for Bunny Stream deletion
		const [video] = await db
			.select()
			.from(videosTable)
			.where(eq(videosTable.id, videoId));

		if (!video) {
			return { success: false, message: "Video not found" };
		}

		// Delete from Bunny Stream first
		try {
			if (video.videoGuid && video.libraryId) {
				await deleteVideoFromBunnyStream(video.libraryId, video.videoGuid);
			}
		} catch (error) {
			console.error("Failed to delete video from Bunny Stream:", error);
			// Continue with database deletion even if Bunny Stream deletion fails
		}

		// Hard delete from database
		await db.delete(videosTable).where(eq(videosTable.id, videoId));

		return {
			success: true,
			message: "Video deleted successfully",
		};
	} catch (error) {
		console.error("Error deleting video:", error);
		return { success: false, message: "Failed to delete video" };
	}
}

export async function assignVideoToLesson(
	request: Request,
	videoId: string,
	lessonId: string,
) {
	try {
		const { isLoggedIn } = await isAdminLoggedIn(request);
		if (!isLoggedIn) {
			return { success: false, message: "Unauthorized" };
		}

		// Check if video exists and is ready
		const [video] = await db
			.select()
			.from(videosTable)
			.where(eq(videosTable.id, videoId));

		if (!video) {
			return { success: false, message: "Video not found" };
		}

		if (video.status !== "ready") {
			return {
				success: false,
				message:
					"Video is not ready yet. Please wait for processing to complete.",
			};
		}

		// Update lesson with video reference
		const [updatedLesson] = await db
			.update(lessonsTable)
			.set({
				videoId,
				videoUrl: video.videoGuid, // Keep videoUrl for backward compatibility
				updated_at: new Date(),
			})
			.where(eq(lessonsTable.id, lessonId))
			.returning();

		if (!updatedLesson) {
			return { success: false, message: "Lesson not found" };
		}

		return {
			success: true,
			message: "Video assigned to lesson successfully",
			lesson: updatedLesson,
		};
	} catch (error) {
		console.error("Error assigning video to lesson:", error);
		return { success: false, message: "Failed to assign video to lesson" };
	}
}

export async function updateVideoStatus(
	request: Request,
	videoId: string,
	status: "processing" | "ready" | "failed",
) {
	try {
		const { isLoggedIn } = await isAdminLoggedIn(request);
		if (!isLoggedIn) {
			return { success: false, message: "Unauthorized" };
		}

		const [updatedVideo] = await db
			.update(videosTable)
			.set({
				status,
				updatedAt: new Date(),
			})
			.where(eq(videosTable.id, videoId))
			.returning();

		if (!updatedVideo) {
			return { success: false, message: "Video not found" };
		}

		return {
			success: true,
			message: "Video status updated successfully",
			video: updatedVideo,
		};
	} catch (error) {
		console.error("Error updating video status:", error);
		return { success: false, message: "Failed to update video status" };
	}
}

export async function generateUploadToken(request: Request, title: string) {
	try {
		const { isLoggedIn, admin } = await isAdminLoggedIn(request);
		if (!isLoggedIn || !admin) {
			return { success: false, message: "Unauthorized" };
		}

		const tokenData = await generateVideoUploadToken(title, BUNNY_LIBRARY_ID);

		// Generate thumbnail URL
		const thumbnailUrl = getVideoThumbnailUrl(
			BUNNY_LIBRARY_ID,
			tokenData.videoGuid,
		);

		// Create video record in database with pending status
		const [video] = await db
			.insert(videosTable)
			.values({
				title,
				description: null,
				tags: null,
				videoGuid: tokenData.videoGuid,
				libraryId: BUNNY_LIBRARY_ID,
				thumbnailUrl,
				uploadedBy: admin.id,
				status: "processing",
			})
			.returning();

		return {
			success: true,
			...tokenData,
			videoId: video.id,
		};
	} catch (error) {
		console.error("Error generating upload token:", error);
		return { success: false, message: "Failed to generate upload token" };
	}
}

// Import SQL template
import { sql } from "drizzle-orm";
