import { z } from "zod";
import { MAX_VIDEO_SIZE } from "../constants";

export const uploadVideoSchema = z.object({
	title: z.string().min(1, "Title is required").max(255),
	description: z.string().optional(),
	tags: z.string().optional(),
	videoFile: z
		.instanceof(File)
		.refine((file) => file.size > 0, "Video file is required")
		.refine(
			(file) => file.size <= MAX_VIDEO_SIZE,
			`Video file must be less than ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`,
		),
});

export const updateVideoSchema = z.object({
	videoId: z.string().uuid("Invalid video ID"),
	title: z.string().min(1, "Title is required").max(255),
	description: z.string().optional(),
	tags: z.string().optional(),
	thumbnailUrl: z.string().url().optional(),
});

export const deleteVideoSchema = z.object({
	videoId: z.string().uuid("Invalid video ID"),
});

export const searchVideosSchema = z.object({
	query: z.string().optional(),
	status: z.enum(["processing", "ready", "failed", "all"]).optional(),
	tags: z.string().optional(),
	page: z.number().min(1).default(1),
	limit: z.number().min(1).max(100).default(20),
});

export const assignVideoToLessonSchema = z.object({
	videoId: z.string().uuid("Invalid video ID"),
	lessonId: z.string().uuid("Invalid lesson ID"),
});

export type UploadVideoSchema = z.infer<typeof uploadVideoSchema>;
export type UpdateVideoSchema = z.infer<typeof updateVideoSchema>;
export type DeleteVideoSchema = z.infer<typeof deleteVideoSchema>;
export type SearchVideosSchema = z.infer<typeof searchVideosSchema>;
export type AssignVideoToLessonSchema = z.infer<
	typeof assignVideoToLessonSchema
>;
