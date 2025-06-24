import { z } from "zod";

export const createSegmentSchema = z.object({
	name: z.string().min(1, { message: "Name is required" }).trim(),
	description: z.string().min(1, { message: "Description is required" }).trim(),
	videoUrl: z.string().min(1, { message: "Video URL is required" }).trim(),
	courseSlug: z.string().min(1, { message: "Course slug is required" }).trim(),
	moduleSlug: z.string().min(1, { message: "Module slug is required" }).trim(),
});

export const editSegmentSchema = z.object({
	name: z.string().min(1, { message: "Name is required" }).trim(),
	description: z.string().min(1, { message: "Description is required" }).trim(),
	videoUrl: z.string().min(1, { message: "Video URL is required" }).trim(),
	courseSlug: z.string().min(1, { message: "Course slug is required" }).trim(),
	moduleSlug: z.string().min(1, { message: "Module slug is required" }).trim(),
	segmentSlug: z
		.string()
		.min(1, { message: "Segment slug is required" })
		.trim(),
});

export type CreateSegmentSchema = z.infer<typeof createSegmentSchema>;
export type EditSegmentSchema = z.infer<typeof editSegmentSchema>;
