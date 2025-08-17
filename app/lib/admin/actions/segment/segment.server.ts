import { and, eq, max } from "drizzle-orm";
import { data, redirect } from "react-router";

import { dashboardConfig } from "~/config/dashboard";
import db from "~/db/index.server";
import {
	type Module,
	attachmentsTable,
	lessonsTable,
	videosTable,
} from "~/db/schema";
import { isAdminLoggedIn } from "~/lib/auth/auth.server";
import {
	createAndUploadVideoToBunnyStream,
	generateAttachmentUploadToken,
	generateVideoUploadToken,
	uploadAttachmentToBunny,
} from "~/lib/bunny.server";
import { titleToSlug } from "~/lib/utils";
import {
	createSegmentSchema,
	editSegmentSchema,
} from "../../../zod-schemas/segment";
import { getModuleBySlug } from "../../data-access/modules/modules.server";
import { checkSegmentSlugUniqueForModule } from "../shared/shared.server";

export async function handleCreateSegment(
	request: Request,
	formData: FormData,
) {
	// auth check
	const { isLoggedIn, admin } = await isAdminLoggedIn(request);

	if (!isLoggedIn || !admin) {
		throw redirect("/admin/login");
	}

	// Extract attachments and video file from formData before validation
	const attachments = formData.getAll("attachments") as File[];
	const videoFileFromForm = formData.get("videoFile") as File;

	// Create form data object including video file for validation
	const formDataObject = {
		name: formData.get("name"),
		description: formData.get("description"),
		videoFile: videoFileFromForm,
		courseSlug: formData.get("courseSlug"),
		moduleSlug: formData.get("moduleSlug"),
		attachments: attachments,
	};

	const unvalidatedFields = createSegmentSchema.safeParse(formDataObject);

	if (!unvalidatedFields.success) {
		return data(
			{ success: false, message: "Invalid form data" },
			{ status: 400 },
		);
	}

	const { courseSlug, moduleSlug, name, description, videoFile } =
		unvalidatedFields.data;

	try {
		// getting the module where the lesson will be created
		const { success: moduleResponse, module } = await getModuleBySlug(
			request,
			moduleSlug,
			courseSlug,
		);

		if (!moduleResponse || !module) {
			return data(
				{ success: false, message: "Module not found" },
				{ status: 404 },
			);
		}

		// convert lesson name to slug
		const slug = titleToSlug(name);

		// check the slug created is unique within this module
		const isSlugUnique = await checkSegmentSlugUniqueForModule(slug, module.id);
		if (!isSlugUnique) {
			return data(
				{
					success: false,
					message: "a lesson with this name already exists in this module",
				},
				{ status: 400 },
			);
		}

		// Get the next order index for lessons in this module
		const [nextOrderIndex] = await db
			.select({ max: max(lessonsTable.orderIndex) })
			.from(lessonsTable)
			.where(eq(lessonsTable.moduleId, module.id))
			.limit(1);

		const orderIndex = nextOrderIndex?.max
			? Number.parseInt(nextOrderIndex.max) + 1
			: 0;

		// Upload video to Bunny Stream and get the video GUID
		let videoGuid: string;
		try {
			videoGuid = await createAndUploadVideoToBunnyStream(
				videoFile,
				name, // Use lesson name as video title
				dashboardConfig.libraryId || "", // Library ID from config
			);
		} catch (videoError) {
			console.error("🔴 Error uploading video:", videoError);
			return data(
				{
					success: false,
					message: "Failed to upload video. Please try again.",
				},
				{ status: 500 },
			);
		}

		// Create video record in videosTable
		const [insertedVideo] = await db
			.insert(videosTable)
			.values({
				title: name,
				description: description || null,
				videoGuid: videoGuid,
				uploadedBy: admin.id,
				libraryId: dashboardConfig.libraryId || "",
				status: "ready", // Video is already processed by Bunny
			})
			.returning({
				id: videosTable.id,
			});

		if (!insertedVideo) {
			return data(
				{ success: false, message: "Failed to create video record" },
				{ status: 500 },
			);
		}

		// insert lesson into database
		const [insertedSegment] = await db
			.insert(lessonsTable)
			.values({
				name,
				description,
				videoUrl: `${dashboardConfig.libraryId}/${videoGuid}`, // Store complete path
				videoId: insertedVideo.id, // Reference to videosTable
				slug,
				moduleId: module.id,
				orderIndex: orderIndex.toString(),
			})
			.returning({
				id: lessonsTable.id,
				slug: lessonsTable.slug,
			});

		if (!insertedSegment) {
			return data(
				{ success: false, message: "Failed to create lesson" },
				{ status: 500 },
			);
		}

		// Upload attachments if provided
		if (attachments.length > 0) {
			const validAttachments = attachments.filter((file) => file.size > 0);

			if (validAttachments.length > 0) {
				try {
					const uploadPromises = validAttachments.map(async (file) => {
						const { cdnUrl, fileExtension, fileName } =
							await uploadAttachmentToBunny(file, insertedSegment.id);

						// Insert attachment record into database
						return db.insert(attachmentsTable).values({
							lessonId: insertedSegment.id,
							fileName: fileName,
							fileUrl: cdnUrl,
							fileExtension: fileExtension,
						});
					});

					await Promise.all(uploadPromises);
				} catch (attachmentError) {
					console.error("🔴 Error uploading attachments:", attachmentError);
					// Note: We don't fail the entire operation if attachments fail
					// The lesson is created successfully, just without attachments
				}
			}
		}

		return data(
			{
				success: true,
				message: "Lesson created successfully",
				segmentSlug: insertedSegment.slug,
				redirectTo: `/dashboard/courses/${courseSlug}/${moduleSlug}/${insertedSegment.slug}`,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Error creating lesson:", error);
		return data(
			{
				success: false,
				message:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			},
			{ status: 500 },
		);
	}
}

// Legacy functions for backward compatibility - these need to be updated later
export async function handleEditSegment(request: Request, formData: FormData) {
	// auth check
	const { isLoggedIn } = await isAdminLoggedIn(request);

	if (!isLoggedIn) {
		throw redirect("/admin/login");
	}

	const unvalidatedFields = editSegmentSchema.safeParse(
		Object.fromEntries(formData),
	);

	if (!unvalidatedFields.success) {
		return data(
			{ success: false, message: "Invalid form data" },
			{ status: 400 },
		);
	}

	const { courseSlug, moduleSlug, segmentSlug, name, description, videoUrl } =
		unvalidatedFields.data;

	try {
		// getting the module where the lesson is being edited
		const { success: moduleResponse, module } = await getModuleBySlug(
			request,
			moduleSlug,
			courseSlug,
		);

		if (!moduleResponse || !module) {
			return data(
				{ success: false, message: "Module not found" },
				{ status: 404 },
			);
		}

		// check if the lesson exists in this module
		const existingLesson = module.lessons.find(
			(lesson) => lesson.slug === segmentSlug,
		);
		if (!existingLesson) {
			return data(
				{ success: false, message: "Lesson not found" },
				{ status: 404 },
			);
		}

		// convert lesson name to slug
		const slug = titleToSlug(name);

		// check the slug created is unique within this module (unless it's the same as current)
		const isSlugUnique = await checkSegmentSlugUniqueForModule(
			slug,
			module.id,
			segmentSlug,
		);
		if (!isSlugUnique) {
			return data(
				{
					success: false,
					message: "a lesson with this name already exists in this module",
				},
				{ status: 400 },
			);
		}

		// update lesson in database
		const [updatedLesson] = await db
			.update(lessonsTable)
			.set({
				name,
				description,
				videoUrl,
				slug,
			})
			.where(
				and(
					eq(lessonsTable.slug, segmentSlug),
					eq(lessonsTable.moduleId, module.id),
				),
			)
			.returning({
				slug: lessonsTable.slug,
			});

		if (!updatedLesson) {
			return data(
				{ success: false, message: "Failed to update lesson" },
				{ status: 500 },
			);
		}

		return data(
			{
				success: true,
				message: "Lesson updated successfully",
				redirectTo: `/dashboard/courses/${courseSlug}/${moduleSlug}/${updatedLesson.slug}`,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Error updating lesson:", error);
		return data(
			{
				success: false,
				message:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			},
			{ status: 500 },
		);
	}
}

export async function handleDeleteSegment(
	request: Request,
	formData: FormData,
) {
	const { isLoggedIn } = await isAdminLoggedIn(request);
	if (!isLoggedIn) {
		throw redirect("/admin/login");
	}

	const segmentId = formData.get("segmentId") as string;

	if (!segmentId) {
		return data(
			{ success: false, message: "Segment ID is required" },
			{ status: 400 },
		);
	}

	try {
		// With cascade deletes, we only need to delete the lesson
		// No related records need manual deletion
		await db.delete(lessonsTable).where(eq(lessonsTable.id, segmentId));

		return data(
			{ success: true, message: "Lesson deleted successfully" },
			{ status: 200 },
		);
	} catch (error) {
		console.error("Delete segment error:", error);
		return data(
			{
				success: false,
				message:
					error instanceof Error ? error.message : "An unknown error occurred",
			},
			{ status: 500 },
		);
	}
}

export async function handleMakeSegmentPrivate(
	request: Request,
	formData: FormData,
) {
	return data(
		{
			success: false,
			message: "Private/public functionality has been removed for lessons",
		},
		{ status: 400 },
	);
}

export async function handleMakeSegmentPublic(
	request: Request,
	formData: FormData,
) {
	return data(
		{
			success: false,
			message: "Private/public functionality has been removed for lessons",
		},
		{ status: 400 },
	);
}

// Helper function no longer needed but keeping for compatibility
async function checkIfFirstLessonInFirstModule(
	module: Module,
	courseSlug: string,
): Promise<boolean> {
	return false; // Always return false since we no longer use this logic
}

export async function handleGenerateUploadTokens(
	request: Request,
	formData: FormData,
) {
	// auth check
	const { isLoggedIn } = await isAdminLoggedIn(request);

	if (!isLoggedIn) {
		throw redirect("/admin/login");
	}

	try {
		const name = formData.get("name") as string;
		const lessonId = formData.get("lessonId") as string;
		const attachmentNames = formData.getAll("attachmentNames") as string[];

		if (!name) {
			return data(
				{ success: false, message: "Lesson name is required" },
				{ status: 400 },
			);
		}

		// Generate video upload token

		const videoToken = await generateVideoUploadToken(
			name,
			dashboardConfig.libraryId || "",
		);

		// Generate attachment upload tokens if provided
		const attachmentTokens = await Promise.all(
			attachmentNames.map((fileName) =>
				generateAttachmentUploadToken(lessonId || "temp", fileName),
			),
		);

		return data(
			{
				success: true,
				message: "Upload tokens generated successfully",
				videoToken,
				attachmentTokens,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Error generating upload tokens:", error);
		return data(
			{
				success: false,
				message:
					error instanceof Error
						? error.message
						: "Failed to generate upload tokens",
			},
			{ status: 500 },
		);
	}
}

export async function handleConfirmUploads(
	request: Request,
	formData: FormData,
) {
	// auth check
	const { isLoggedIn, admin } = await isAdminLoggedIn(request);

	if (!isLoggedIn || !admin) {
		throw redirect("/admin/login");
	}

	try {
		const videoGuid = formData.get("videoGuid") as string;
		const videoId = formData.get("videoId") as string; // Get videoId if using library video
		const attachmentUrls = formData.getAll("attachmentUrls") as string[];
		const attachmentData = formData.get("attachmentData") as string;

		const name = formData.get("name") as string;
		const description = formData.get("description") as string;
		const courseSlug = formData.get("courseSlug") as string;
		const moduleSlug = formData.get("moduleSlug") as string;

		if (!videoGuid || !name || !description || !courseSlug || !moduleSlug) {
			return data(
				{ success: false, message: "Missing required fields" },
				{ status: 400 },
			);
		}

		// Get the module where the lesson will be created
		const { success: moduleResponse, module } = await getModuleBySlug(
			request,
			moduleSlug,
			courseSlug,
		);

		if (!moduleResponse || !module) {
			return data(
				{ success: false, message: "Module not found" },
				{ status: 404 },
			);
		}

		// Convert lesson name to slug
		const slug = titleToSlug(name);

		// Check the slug created is unique within this module
		const isSlugUnique = await checkSegmentSlugUniqueForModule(slug, module.id);
		if (!isSlugUnique) {
			return data(
				{
					success: false,
					message: "a lesson with this name already exists in this module",
				},
				{ status: 400 },
			);
		}

		// Get the next order index for lessons in this module
		const [nextOrderIndex] = await db
			.select({ max: max(lessonsTable.orderIndex) })
			.from(lessonsTable)
			.where(eq(lessonsTable.moduleId, module.id))
			.limit(1);

		const orderIndex = nextOrderIndex?.max
			? Number.parseInt(nextOrderIndex.max) + 1
			: 0;

		// Use existing video ID if provided (library video), otherwise create new video record
		let finalVideoId: string;
		let finalVideoUrl: string;

		if (videoId) {
			// Using existing video from library
			finalVideoId = videoId;

			// Fetch the video's libraryId to construct proper URL
			const [existingVideo] = await db
				.select({
					libraryId: videosTable.libraryId,
				})
				.from(videosTable)
				.where(eq(videosTable.id, videoId))
				.limit(1);

			if (!existingVideo) {
				return data(
					{ success: false, message: "Selected video not found" },
					{ status: 404 },
				);
			}

			// Store the complete path with libraryId for proper display
			finalVideoUrl = `${existingVideo.libraryId}/${videoGuid}`;
		} else {
			// Create new video record for uploaded video
			const [insertedVideo] = await db
				.insert(videosTable)
				.values({
					title: name,
					description: description || null,
					videoGuid: videoGuid,
					uploadedBy: admin.id,
					libraryId: dashboardConfig.libraryId || "",
					status: "ready", // Video is already processed by Bunny
				})
				.returning({
					id: videosTable.id,
				});

			if (!insertedVideo) {
				return data(
					{ success: false, message: "Failed to create video record" },
					{ status: 500 },
				);
			}

			finalVideoId = insertedVideo.id;
			// For new uploads, also store the complete path
			finalVideoUrl = `${dashboardConfig.libraryId}/${videoGuid}`;
		}

		// Insert lesson into database
		const [insertedSegment] = await db
			.insert(lessonsTable)
			.values({
				name,
				description,
				videoUrl: finalVideoUrl, // Store the complete libraryId/videoGuid path
				videoId: finalVideoId, // Reference to videosTable
				slug,
				moduleId: module.id,
				orderIndex: orderIndex.toString(),
			})
			.returning({
				id: lessonsTable.id,
				slug: lessonsTable.slug,
			});

		if (!insertedSegment) {
			return data(
				{ success: false, message: "Failed to create lesson" },
				{ status: 500 },
			);
		}

		// Save attachment data if provided
		if (attachmentData) {
			try {
				const attachments = JSON.parse(attachmentData) as Array<{
					fileName: string;
					fileUrl: string;
					fileExtension: string;
				}>;

				const attachmentPromises = attachments.map((attachment) =>
					db.insert(attachmentsTable).values({
						lessonId: insertedSegment.id,
						fileName: attachment.fileName,
						fileUrl: attachment.fileUrl,
						fileExtension: attachment.fileExtension,
					}),
				);

				await Promise.all(attachmentPromises);
			} catch (attachmentError) {
				console.error("🔴 Error saving attachments:", attachmentError);
			}
		}

		return data(
			{
				success: true,
				message: "Lesson created successfully",
				segmentSlug: insertedSegment.slug,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Error confirming uploads:", error);
		return data(
			{
				success: false,
				message:
					error instanceof Error ? error.message : "Failed to confirm uploads",
			},
			{ status: 500 },
		);
	}
}
