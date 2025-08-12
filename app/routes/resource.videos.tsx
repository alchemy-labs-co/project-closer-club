import { data } from "react-router";
import { eq } from "drizzle-orm";
import db from "~/db/index.server";
import { videosTable } from "~/db/schema";
import { isAdminLoggedIn } from "~/lib/auth/auth.server";
import {
	generateUploadToken,
	updateVideoStatus,
	uploadVideoToLibrary,
	deleteVideo,
} from "~/lib/admin/actions/videos/videos.server";
import type { Route } from "./+types/resource.videos";

export async function action({ request }: Route.ActionArgs) {
	const { isLoggedIn, admin } = await isAdminLoggedIn(request);
	if (!isLoggedIn || !admin) {
		return data({ success: false, message: "Unauthorized" }, { status: 401 });
	}

	const formData = await request.formData();
	const intent = formData.get("intent") as string;

	switch (intent) {
		case "generate-upload-token": {
			const title = formData.get("title") as string;

			if (!title) {
				return data(
					{ success: false, message: "Title is required" },
					{ status: 400 },
				);
			}

			const result = await generateUploadToken(request, title);
			return data(result);
		}

		case "confirm-upload": {
			const videoId = formData.get("videoId") as string;
			const videoGuid = formData.get("videoGuid") as string;
			const title = formData.get("title") as string;
			const description = formData.get("description") as string;
			const tags = formData.get("tags") as string;
			const fileSize = formData.get("fileSize") as string;

			if (!videoId || !videoGuid) {
				return data(
					{ success: false, message: "Video ID and GUID are required" },
					{ status: 400 },
				);
			}

			// Update video metadata in database
			const [updatedVideo] = await db
				.update(videosTable)
				.set({
					title,
					description: description || null,
					tags: tags || null,
					fileSize: fileSize ? Number(fileSize) : null,
					status: "ready",
					updatedAt: new Date(),
				})
				.where(eq(videosTable.id, videoId))
				.returning();

			if (!updatedVideo) {
				return data(
					{ success: false, message: "Video not found" },
					{ status: 404 },
				);
			}

			return data({
				success: true,
				message: "Video uploaded successfully",
				video: updatedVideo,
			});
		}

		case "upload": {
			// Direct upload (not used in current implementation but kept for compatibility)
			return uploadVideoToLibrary(request, formData);
		}

		case "update-status": {
			const videoId = formData.get("videoId") as string;
			const status = formData.get("status") as
				| "processing"
				| "ready"
				| "failed";

			if (!videoId || !status) {
				return data(
					{ success: false, message: "Video ID and status are required" },
					{ status: 400 },
				);
			}

			const result = await updateVideoStatus(request, videoId, status);
			return data(result);
		}

		case "delete": {
			const videoId = formData.get("videoId") as string;

			if (!videoId) {
				return data(
					{ success: false, message: "Video ID is required" },
					{ status: 400 },
				);
			}

			const result = await deleteVideo(request, videoId);
			return data(result);
		}

		default: {
			return data(
				{ success: false, message: "Invalid intent" },
				{ status: 400 },
			);
		}
	}
}
