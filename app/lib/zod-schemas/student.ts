import { z } from "zod";

// Valid domains for email addresses
const VALID_DOMAINS = ["@universecoverage.com", "@spectra.com"] as const;

// Custom email validation for domain restriction
const domainRestrictedEmail = z
	.string()
	.min(1, { message: "Email is required" })
	.trim()

	.refine(
		(email) => {
			const domain = email.substring(email.lastIndexOf("@"));
			return VALID_DOMAINS.includes(domain as typeof VALID_DOMAINS[number]);
		},
		{
			message: `Email must be from one of the following domains: ${VALID_DOMAINS.join(", ")}`,
		}
	);

export const createStudentSchema = z.object({
	name: z.string().min(1, { message: "Name is required" }).trim(),
	email: domainRestrictedEmail,
	phoneNumber: z
		.string()
		.optional()
		.refine((val) => !val || val.length >= 10, {
			message: "Phone number must be at least 10 characters long",
		}),
	password: z
		.string()
		.min(8, { message: "Password must be at least 8 characters long" })
		.trim(),
	courses: z.array(z.string()).optional(),
});
export const updateStudentSchema = z.object({
	name: z.string().min(1, { message: "Name is required" }),
	email: domainRestrictedEmail,
	phoneNumber: z
		.string()
		.optional()
		.refine((val) => !val || val.length >= 10, {
			message: "Phone number must be at least 10 characters long",
		}),
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
