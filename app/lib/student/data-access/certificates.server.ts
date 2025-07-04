import { eq, and, isNotNull, ne } from "drizzle-orm";
import { redirect } from "react-router";
import db from "~/db/index.server";
import { certificatesTable, coursesTable } from "~/db/schema";
import { isAgentLoggedIn } from "~/lib/auth/auth.server";

export async function getStudentCertificateForCourse(
    request: Request,
    studentId: string,
    courseSlug: string
): Promise<{ certificateUrl: string; id: string } | null> {
    const { isLoggedIn } = await isAgentLoggedIn(request);
    if (!isLoggedIn) {
        throw redirect("/login");
    }
    try {
        const result = await db
            .select({
                id: certificatesTable.id,
                certificateUrl: certificatesTable.certificateUrl,
            })
            .from(certificatesTable)
            .innerJoin(coursesTable, eq(certificatesTable.courseId, coursesTable.id))
            .where(
                and(
                    eq(certificatesTable.studentId, studentId),
                    eq(coursesTable.slug, courseSlug),
                    // Only return certificates that have a valid URL
                    isNotNull(certificatesTable.certificateUrl),
                    ne(certificatesTable.certificateUrl, "")
                )
            )
            .limit(1);

        if (result.length === 0 || !result[0].certificateUrl) {
            return null;
        }

        return result[0];
    } catch (error) {
        console.error("Error fetching student certificate:", error);
        return null;
    }
}
