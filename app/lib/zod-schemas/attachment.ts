import { z } from "zod";

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = [
	"application/pdf",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/msword",
	"image/png",
	"image/jpg",
	"image/jpeg",
	"text/plain",
	"text/csv",
	"text/markdown",
	"application/x-markdown",
];

// Schema for creating attachments
export const createAttachmentSchema = z.object({
	lessonId: z.string().uuid({ message: "Valid lesson ID is required" }),
	attachments: z
		.array(
			z
				.instanceof(File)
				.refine((file) => file.size > 0, "File is required")
				.refine(
					(file) => file.size <= MAX_FILE_SIZE,
					`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
				)
				.refine(
					(file) => ACCEPTED_FILE_TYPES.includes(file.type),
					"File type not supported. Allowed types: PDF, DOCX, DOC, PNG, JPG, JPEG, TXT, CSV, MD",
				),
		)
		.min(1, { message: "At least one attachment is required" })
		.max(10, { message: "Maximum 10 files allowed" }),
});

// Schema for deleting attachments
export const deleteAttachmentSchema = z.object({
	attachmentId: z.string().uuid({ message: "Valid attachment ID is required" }),
});

// Schema for updating attachment file name
export const updateAttachmentSchema = z.object({
	attachmentId: z.string().uuid({ message: "Valid attachment ID is required" }),
	fileName: z
		.string()
		.min(1, { message: "File name is required" })
		.max(255, { message: "File name must be less than 255 characters" })
		.trim(),
});

// Schema for form data parsing (used in server actions)
export const createAttachmentFormSchema = z.object({
	lessonId: z.string().uuid({ message: "Valid lesson ID is required" }),
});

export const deleteAttachmentFormSchema = z.object({
	attachmentId: z.string().uuid({ message: "Valid attachment ID is required" }),
});

export const updateAttachmentFormSchema = z.object({
	attachmentId: z.string().uuid({ message: "Valid attachment ID is required" }),
	fileName: z
		.string()
		.min(1, { message: "File name is required" })
		.max(255, { message: "File name must be less than 255 characters" })
		.trim(),
});

// Client-side schema for file upload validation
export const attachmentUploadSchema = z.object({
	attachments: z
		.array(z.instanceof(File))
		.min(1, { message: "At least one file is required" })
		.max(10, { message: "Maximum 10 files allowed" }),
});

// Types
export type CreateAttachmentSchema = z.infer<typeof createAttachmentSchema>;
export type DeleteAttachmentSchema = z.infer<typeof deleteAttachmentSchema>;
export type UpdateAttachmentSchema = z.infer<typeof updateAttachmentSchema>;
export type CreateAttachmentFormSchema = z.infer<
	typeof createAttachmentFormSchema
>;
export type DeleteAttachmentFormSchema = z.infer<
	typeof deleteAttachmentFormSchema
>;
export type UpdateAttachmentFormSchema = z.infer<
	typeof updateAttachmentFormSchema
>;
export type AttachmentUploadSchema = z.infer<typeof attachmentUploadSchema>;

// Export constants for use in components
export { MAX_FILE_SIZE, ACCEPTED_FILE_TYPES };
