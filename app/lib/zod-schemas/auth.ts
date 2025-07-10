import { z } from "zod";

// Valid domains for email addresses
// const VALID_DOMAINS = ["@universecoverage.com", "@spectra.com"] as const;

// Custom email validation for domain restriction
// export const domainRestrictedEmail = z
//   .string()
//   .min(1, { message: "Email is required" })
//   .trim()
//   .refine(
//     (email) => {
//       const domain = email.substring(email.lastIndexOf("@"));
//       return VALID_DOMAINS.includes(domain as (typeof VALID_DOMAINS)[number]);
//     },
//     {
//       message: `Email must be from one of the following domains: ${VALID_DOMAINS.join(
//         ", "
//       )}`,
//     }
//   );

export const adminLoginSchema = z.object({
  email: z.string().email("Email is required"),
  password: z
    .string()
    .min(1, { message: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters long" })
    .trim(),
});

export const loginSchema = z.object({
  email: z.string().email({ message: "Email is required" }),
  password: z
    .string()
    .min(1, { message: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters long" })
    .trim(),
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type AdminLoginSchema = z.infer<typeof adminLoginSchema>;
