import { z } from "zod";

export const createModuleSchema = z.object({
    name: z.string().min(1, { message: "Name is required" }).trim(),
    courseSlug: z.string().min(1, { message: "Course slug is required" }).trim(),
    description: z.string().optional(),
});

export const editModuleSchema = z.object({
    name: z.string().min(1, { message: "Name is required" }).trim(),
    courseSlug: z.string().min(1, { message: "Course slug is required" }).trim(),
    moduleSlug: z.string().min(1, { message: "Module slug is required" }).trim(),
    description: z.string().optional(),
});

export type CreateModuleSchema = z.infer<typeof createModuleSchema>;
export type EditModuleSchema = z.infer<typeof editModuleSchema>; 