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

export const createTeamLeaderSchema = z.object({
	name: z.string().min(1, { message: "Name is required" }).trim(),
	email: domainRestrictedEmail,
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
	agents: z.array(z.string()),
	courses: z.array(z.string()).optional(),
});

export const updateTeamLeaderSchema = z.object({
	name: z.string().min(1, { message: "Name is required" }),
	email: domainRestrictedEmail,
	phoneNumber: z
		.string()
		.refine((val) => val === "" || val.length >= 10, {
			message: "Phone number must be at least 10 characters long",
		})
		.optional(),
});

export const updateTeamLeaderPasswordSchema = z.object({
	password: z
		.string()
		.min(8, { message: "Password must be at least 8 characters long" }),
});

// types
export type CreateTeamLeaderSchema = z.infer<typeof createTeamLeaderSchema>;
export type UpdateTeamLeaderSchema = z.infer<typeof updateTeamLeaderSchema>;
export type UpdateTeamLeaderPasswordSchema = z.infer<
	typeof updateTeamLeaderPasswordSchema
>;
