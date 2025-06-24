import { z } from "zod";

export const createCourseSchema = z.object({
	name: z.string().min(1, { message: "Name is required" }).trim(),
	description: z.string().min(1, { message: "Description is required" }).trim(),
	students: z
		.array(z.string())
		.min(1, { message: "At least one student must be assigned to the course" }),
});

export const updateCourseSchema = z.object({
	name: z.string().min(1, { message: "Name is required" }).trim(),
	description: z.string().min(1, { message: "Description is required" }).trim(),
});

export const assignCourseSchema = z.object({
	studentId: z.string().min(1, { message: "Student ID required" }),
	courseId: z.string().min(1, { message: "CourseID required" }),
	isAssigned: z.boolean(),
});

// types
export type CreateCourseSchema = z.infer<typeof createCourseSchema>;
export type UpdateCourseSchema = z.infer<typeof updateCourseSchema>;
export type AssignCourseShema = z.infer<typeof assignCourseSchema>;
