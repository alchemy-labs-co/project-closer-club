import { z } from "zod";

export const createTeamLeaderSchema = z.object({
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
    agents: z
        .array(z.string()),
});

export const updateTeamLeaderSchema = z.object({
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