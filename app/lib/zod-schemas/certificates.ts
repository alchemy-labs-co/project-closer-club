import { z } from "zod";

export const downloadCertificateSchema = z.object({
    studentId: z.string(),
    courseName: z.string(),
    studentName: z.string(),
    courseSlug: z.string(),
});