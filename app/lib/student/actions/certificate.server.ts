import { redirect } from "react-router";
import { certificatesTable, coursesTable } from "~/db/schema";
import db from "~/db/index.server";
import { isAgentLoggedIn } from "~/lib/auth/auth.server";
import { downloadCertificateSchema } from "~/lib/zod-schemas/certificates";
import { eq, and } from "drizzle-orm";
import { uploadCertificateToBunny } from "~/lib/bunny.server";

// ImageKit configuration
const IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/kboef4cls2";
const CERTIFICATE_TEMPLATE_PATH = "Blue%20and%20Gold%20Simple%20Certificate.png";

function generateCertificateUrl(studentName: string,): string {
    // Encode the student name and course name for URL
    const encodedStudentName = encodeURIComponent(studentName);

    // Create ImageKit transformation URL with text overlays
    // Using percentage-based positioning for reliable centering:
    // lx-bw_mul_0.47: positions horizontally at 47% (slightly left of center for better visual centering)
    // ly-bh_mul_0.5: positions vertically at 50% (center)
    const transformations = [
        // Student name layer - centered with slight left adjustment
        `l-text,i-${encodedStudentName},fs-60,co-2C3E50,ff-Montserrat,tg-b,lx-bw_mul_0.45,ly-bh_mul_0.5,l-end`,
    ].join(':');

    return `${IMAGEKIT_URL_ENDPOINT}/${CERTIFICATE_TEMPLATE_PATH}?tr=${transformations}`;
}

async function fetchCertificateImage(certificateUrl: string): Promise<ArrayBuffer> {
    const response = await fetch(certificateUrl);

    if (!response.ok) {
        throw new Error(`Failed to fetch certificate image: ${response.status} - ${response.statusText}`);
    }

    return await response.arrayBuffer();
}

export async function handleDownloadCertificate(request: Request, formData: FormData) {
    const { isLoggedIn } = await isAgentLoggedIn(request);
    if (!isLoggedIn) {
        throw redirect("/login")
    }
    const { studentId, courseName, studentName, courseSlug } = Object.fromEntries(formData);

    const unvalidatedFields = {
        studentId,
        courseName,
        studentName,
        courseSlug,
    };

    const result = downloadCertificateSchema.safeParse(unvalidatedFields);
    if (!result.success) {
        return {
            success: false,
            message: "Invalid form submission",
        }
    }

    const validatedFields = result.data;
    try {
        // Get course ID from database
        const [{ id: courseId }] = await db.select({
            id: coursesTable.id,
        }).from(coursesTable).where(eq(coursesTable.slug, validatedFields.courseSlug)).limit(1);

        if (!courseId) {
            return {
                success: false,
                message: "Course not found",
            }
        }

        // Check if certificate already exists for this student and course
        const existingCertificate = await db.select()
            .from(certificatesTable)
            .where(
                and(
                    eq(certificatesTable.studentId, validatedFields.studentId),
                    eq(certificatesTable.courseId, courseId)
                )
            )
            .limit(1);

        if (existingCertificate.length > 0 && existingCertificate[0].certificateUrl) {
            return {
                success: true,
                message: "Certificate already exists",
                certificateUrl: existingCertificate[0].certificateUrl,
            }
        }

        console.log("🎓 Generating certificate for:", {
            studentName: validatedFields.studentName,
            courseName: validatedFields.courseName,
        });

        // 1. Generate ImageKit URL with transformations for student name and course name
        const certificateImageUrl = generateCertificateUrl(
            validatedFields.studentName,
        );

        console.log("📸 Certificate image URL:", certificateImageUrl);

        // 2. Fetch the transformed certificate image from ImageKit
        const certificateImageBuffer = await fetchCertificateImage(certificateImageUrl);

        console.log("⬆️ Uploading certificate to Bunny storage...");

        // 3. Upload the certificate to Bunny storage CDN
        const certificateUrl = await uploadCertificateToBunny(
            certificateImageBuffer,
            validatedFields.studentId,
            validatedFields.courseSlug
        );

        console.log("✅ Certificate uploaded to:", certificateUrl);

        // 4. Update the database with the certificate URL
        if (existingCertificate.length > 0) {
            // Update existing certificate entry
            await db.update(certificatesTable)
                .set({ certificateUrl })
                .where(eq(certificatesTable.id, existingCertificate[0].id));
        } else {
            // Create new certificate entry
            await db.insert(certificatesTable).values({
                courseId,
                studentId: validatedFields.studentId,
                certificateUrl,
            });
        }

        console.log("🎉 Certificate generation completed successfully!");

        // 5. TODO: Send emails to student and admin (future enhancement)
        // await sendCertificateEmails(validatedFields.studentName, validatedFields.courseName, certificateUrl);

        return {
            success: true,
            message: "Certificate generated and downloaded successfully",
            certificateUrl,
        }
    } catch (error) {
        console.error("🔴 Certificate generation error:", error);
        return {
            success: false,
            message: "An unexpected error occurred while generating the certificate",
        }
    }
}