import { eq } from "drizzle-orm";
import { data, redirect } from "react-router";
import db from "~/db/index.server";
import { attachmentsTable, lessonsTable } from "~/db/schema";
import { isAdminLoggedIn } from "~/lib/auth/auth.server";
import {
	deleteAttachmentFromBunny,
	uploadAttachmentToBunny,
} from "~/lib/bunny.server";
import {
	createAttachmentFormSchema,
	deleteAttachmentFormSchema,
	updateAttachmentFormSchema,
} from "~/lib/zod-schemas/attachment";

export async function createAttachment(request: Request, formData: FormData) {
	const { isLoggedIn } = await isAdminLoggedIn(request);
	if (!isLoggedIn) {
		throw redirect("/admin/login");
	}

	try {
		// Validate form data
		const formDataObject = {
			lessonId: formData.get("lessonId"),
		};

		const validation = createAttachmentFormSchema.safeParse(formDataObject);
		if (!validation.success) {
			return data(
				{
					success: false,
					message: validation.error.errors[0]?.message || "Invalid form data",
				},
				{ status: 400 },
			);
		}

		const { lessonId } = validation.data;
		const attachments = formData.getAll("attachments") as File[];

		if (!attachments || attachments.length === 0) {
			return data(
				{ success: false, message: "At least one attachment is required" },
				{ status: 400 },
			);
		}

		if (attachments.length > 10) {
			return data(
				{ success: false, message: "Maximum 10 files allowed" },
				{ status: 400 },
			);
		}

		// Verify lesson exists
		const [lesson] = await db
			.select()
			.from(lessonsTable)
			.where(eq(lessonsTable.id, lessonId))
			.limit(1);
		if (!lesson) {
			return data(
				{ success: false, message: "Lesson not found" },
				{ status: 404 },
			);
		}

		// Filter and validate attachments
		const validAttachments = attachments.filter((file) => file.size > 0);

		if (validAttachments.length === 0) {
			return data(
				{ success: false, message: "No valid attachments provided" },
				{ status: 400 },
			);
		}

		// Validate file types and sizes
		const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
		const ACCEPTED_FILE_TYPES = [
			"application/pdf",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			"application/msword",
			"image/png",
			"image/jpg",
			"image/jpeg",
		];

		for (const file of validAttachments) {
			if (file.size > MAX_FILE_SIZE) {
				return data(
					{
						success: false,
						message: `File "${file.name}" is too large. Maximum size is 10MB`,
					},
					{ status: 400 },
				);
			}
			if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
				return data(
					{
						success: false,
						message: `File "${file.name}" is not a supported type. Allowed types: PDF, DOCX, DOC, PNG, JPG, JPEG`,
					},
					{ status: 400 },
				);
			}
		}

		// Upload attachments
		const uploadPromises = validAttachments.map(async (file) => {
			const { cdnUrl, fileExtension, fileName } = await uploadAttachmentToBunny(
				file,
				lessonId,
			);

			// Insert attachment record into database
			return db.insert(attachmentsTable).values({
				lessonId: lessonId,
				fileName: fileName,
				fileUrl: cdnUrl,
				fileExtension: fileExtension,
			});
		});

		await Promise.all(uploadPromises);

		return data(
			{
				success: true,
				message: `Successfully uploaded ${validAttachments.length} attachment(s)`,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Error creating attachment:", error);
		return data(
			{ success: false, message: "Failed to upload attachment" },
			{ status: 500 },
		);
	}
}

export async function deleteAttachment(request: Request, formData: FormData) {
	const { isLoggedIn } = await isAdminLoggedIn(request);
	if (!isLoggedIn) {
		throw redirect("/admin/login");
	}

	try {
		// Validate form data
		const formDataObject = {
			attachmentId: formData.get("attachmentId"),
		};

		const validation = deleteAttachmentFormSchema.safeParse(formDataObject);
		if (!validation.success) {
			return data(
				{
					success: false,
					message: validation.error.errors[0]?.message || "Invalid form data",
				},
				{ status: 400 },
			);
		}

		const { attachmentId } = validation.data;

		// Verify attachment exists
		const [attachment] = await db
			.select()
			.from(attachmentsTable)
			.where(eq(attachmentsTable.id, attachmentId))
			.limit(1);
		if (!attachment) {
			return data(
				{ success: false, message: "Attachment not found" },
				{ status: 404 },
			);
		}

		// Delete attachment from Bunny storage first
		try {
			await deleteAttachmentFromBunny(attachment.fileUrl);
		} catch (bunnyError) {
			console.error(
				"Failed to delete from Bunny storage, proceeding with database deletion:",
				bunnyError,
			);
			// We continue with database deletion even if Bunny deletion fails
			// to avoid orphaned database records
		}

		// Delete attachment from database
		await db
			.delete(attachmentsTable)
			.where(eq(attachmentsTable.id, attachmentId));

		return data(
			{ success: true, message: "Attachment deleted successfully" },
			{ status: 200 },
		);
	} catch (error) {
		console.error("Error deleting attachment:", error);
		return data(
			{ success: false, message: "Failed to delete attachment" },
			{ status: 500 },
		);
	}
}

export async function updateAttachment(request: Request, formData: FormData) {
	const { isLoggedIn } = await isAdminLoggedIn(request);
	if (!isLoggedIn) {
		throw redirect("/admin/login");
	}

	try {
		// Validate form data
		const formDataObject = {
			attachmentId: formData.get("attachmentId"),
			fileName: formData.get("fileName"),
		};

		const validation = updateAttachmentFormSchema.safeParse(formDataObject);
		if (!validation.success) {
			return data(
				{
					success: false,
					message: validation.error.errors[0]?.message || "Invalid form data",
				},
				{ status: 400 },
			);
		}

		const { attachmentId, fileName } = validation.data;

		// Verify attachment exists
		const [attachment] = await db
			.select()
			.from(attachmentsTable)
			.where(eq(attachmentsTable.id, attachmentId))
			.limit(1);
		if (!attachment) {
			return data(
				{ success: false, message: "Attachment not found" },
				{ status: 404 },
			);
		}

		// Update attachment file name in database
		await db
			.update(attachmentsTable)
			.set({ fileName })
			.where(eq(attachmentsTable.id, attachmentId));

		return data(
			{ success: true, message: "Attachment file name updated successfully" },
			{ status: 200 },
		);
	} catch (error) {
		console.error("Error updating attachment:", error);
		return data(
			{ success: false, message: "Failed to update attachment" },
			{ status: 500 },
		);
	}
}

export async function generateAttachmentUploadTokens(
	request: Request,
	formData: FormData,
) {
	const { isLoggedIn } = await isAdminLoggedIn(request);
	if (!isLoggedIn) {
		throw redirect("/admin/login");
	}

	try {
		const lessonId = formData.get("lessonId") as string;
		const attachmentNames = formData.getAll("attachmentNames") as string[];

		if (!lessonId) {
			return data(
				{ success: false, message: "Lesson ID is required" },
				{ status: 400 },
			);
		}

		if (!attachmentNames || attachmentNames.length === 0) {
			return data(
				{ success: false, message: "At least one attachment name is required" },
				{ status: 400 },
			);
		}

		if (attachmentNames.length > 10) {
			return data(
				{ success: false, message: "Maximum 10 files allowed" },
				{ status: 400 },
			);
		}

		// Verify lesson exists
		const [lesson] = await db
			.select()
			.from(lessonsTable)
			.where(eq(lessonsTable.id, lessonId))
			.limit(1);
		if (!lesson) {
			return data(
				{ success: false, message: "Lesson not found" },
				{ status: 404 },
			);
		}

		// Generate upload tokens for each attachment
		const { generateAttachmentUploadToken } = await import(
			"~/lib/bunny.server"
		);

		const attachmentTokens = await Promise.all(
			attachmentNames.map((fileName) =>
				generateAttachmentUploadToken(lessonId, fileName),
			),
		);

		return data(
			{
				success: true,
				message: "Upload tokens generated successfully",
				attachmentTokens,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Error generating attachment upload tokens:", error);
		return data(
			{ success: false, message: "Failed to generate upload tokens" },
			{ status: 500 },
		);
	}
}

export async function confirmAttachmentUploads(
	request: Request,
	formData: FormData,
) {
	const { isLoggedIn } = await isAdminLoggedIn(request);
	if (!isLoggedIn) {
		throw redirect("/admin/login");
	}

	try {
		const lessonId = formData.get("lessonId") as string;
		const attachmentData = formData.get("attachmentData") as string;

		if (!lessonId || !attachmentData) {
			return data(
				{ success: false, message: "Missing required fields" },
				{ status: 400 },
			);
		}

		// Verify lesson exists
		const [lesson] = await db
			.select()
			.from(lessonsTable)
			.where(eq(lessonsTable.id, lessonId))
			.limit(1);
		if (!lesson) {
			return data(
				{ success: false, message: "Lesson not found" },
				{ status: 404 },
			);
		}

		// Parse attachment data
		const attachments = JSON.parse(attachmentData) as Array<{
			fileName: string;
			fileUrl: string;
			fileExtension: string;
		}>;

		if (attachments.length === 0) {
			return data(
				{ success: false, message: "No attachments to save" },
				{ status: 400 },
			);
		}

		// Insert attachment records into database
		const uploadPromises = attachments.map((attachment) =>
			db.insert(attachmentsTable).values({
				lessonId: lessonId,
				fileName: attachment.fileName,
				fileUrl: attachment.fileUrl,
				fileExtension: attachment.fileExtension,
			}),
		);

		await Promise.all(uploadPromises);

		return data(
			{
				success: true,
				message: `Successfully uploaded ${attachments.length} attachment(s)`,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Error confirming attachment uploads:", error);
		return data(
			{ success: false, message: "Failed to save attachments" },
			{ status: 500 },
		);
	}
}
