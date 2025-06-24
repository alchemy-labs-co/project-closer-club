import { z } from "zod";

export const createStudentSchema = z.object({
	name: z.string().min(1, { message: "Name is required" }).trim(),
	email: z
		.string()
		.email({ message: "Invalid email address" })
		.min(1, { message: "Email is required" })
		.trim(),
	phoneNumber: z
		.string()
		.refine((val) => val === "" || val.length >= 10, {
			message: "Phone number must be at least 10 characters long",
		})
		.optional(),
	password: z
		.string()
		.min(8, { message: "Password must be at least 8 characters long" })
		.trim(),
	courses: z.array(z.string()).optional(),
});
export const updateStudentSchema = z.object({
	name: z.string().min(1, { message: "Name is required" }),
	email: z
		.string()
		.email({ message: "Invalid email address" })
		.min(1, { message: "Email is required" }),
	phoneNumber: z
		.string()
		.refine((val) => val === "" || val.length >= 10, {
			message: "Phone number must be at least 10 characters long",
		})
		.optional(),
});
export const updateStudentPasswordSchema = z.object({
	password: z
		.string()
		.min(8, { message: "Password must be at least 8 characters long" }),
});
export const assignStudentToCourseSchema = z.object({
	studentId: z.string().min(1, { message: "Student ID is required" }),
	courseId: z.string().min(1, { message: "Course ID is required" }),
	students: z
		.array(z.string())
		.min(1, { message: "At least one student must be assigned to the course" }),
});

// types
export type CreateStudentSchema = z.infer<typeof createStudentSchema>;
export type UpdateStudentSchema = z.infer<typeof updateStudentSchema>;
export type UpdateStudentPasswordSchema = z.infer<
	typeof updateStudentPasswordSchema
>;
export type AssignedStudentToCourseSchemaType = z.infer<
	typeof assignStudentToCourseSchema
>;
