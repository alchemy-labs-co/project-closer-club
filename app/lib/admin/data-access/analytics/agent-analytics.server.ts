import { and, count, eq } from "drizzle-orm";
import { redirect } from "react-router";
import db from "~/db/index.server";
import {
    completedQuizAssignmentsTable,
    coursesTable,
    lessonsTable,
    modulesTable,
    studentCoursesTable,
} from "~/db/schema";
import { isAdminLoggedIn } from "~/lib/auth/auth.server";

export type AgentAnalytics = {
    courseCompletionAnalytics: {
        success: boolean;
        studentId: string;
        courses: {
            id: string;
            name: string | null;
            description: string | null;
            thumbnailUrl: string | null;
            slug: string | null;
            totalLessons: number;
            completedLessons: number;
            progressPercentage: number;
        }[];
        summary: {
            totalEnrolledCourses: number;
            averageProgress: number;
            totalLessons: number;
            totalCompletedLessons: number;
        };
    };
}
// Get a specific agent's progress across all their assigned courses
export async function getAgentCoursesProgress(
    request: Request,
    studentId: string,
) {
    const { isLoggedIn, admin } = await isAdminLoggedIn(request);
    if (!isLoggedIn || !admin) {
        throw redirect("/admin/login");
    }

    try {
        // Get all courses the agent is enrolled in
        const enrolledCourses = await db
            .select({
                courseId: coursesTable.id,
                courseName: coursesTable.name,
                courseDescription: coursesTable.description,
                courseThumbnailUrl: coursesTable.thumbnailUrl,
                courseSlug: coursesTable.slug,
            })
            .from(studentCoursesTable)
            .leftJoin(coursesTable, eq(studentCoursesTable.courseId, coursesTable.id))
            .where(eq(studentCoursesTable.studentId, studentId));

        // Calculate progress for each course
        const coursesWithProgress = await Promise.all(
            enrolledCourses.map(async (course) => {
                if (!course.courseId) return null;

                // Get total lessons in this course
                const [totalLessonsResult] = await db
                    .select({
                        totalLessons: count(lessonsTable.id),
                    })
                    .from(lessonsTable)
                    .leftJoin(modulesTable, eq(lessonsTable.moduleId, modulesTable.id))
                    .where(eq(modulesTable.courseId, course.courseId));

                // Get completed lessons for this specific agent in this course
                const [completedLessonsResult] = await db
                    .select({
                        completedLessons: count(completedQuizAssignmentsTable.id),
                    })
                    .from(completedQuizAssignmentsTable)
                    .leftJoin(
                        lessonsTable,
                        eq(completedQuizAssignmentsTable.lessonId, lessonsTable.id),
                    )
                    .leftJoin(modulesTable, eq(lessonsTable.moduleId, modulesTable.id))
                    .where(
                        and(
                            eq(modulesTable.courseId, course.courseId),
                            eq(completedQuizAssignmentsTable.studentId, studentId),
                        ),
                    );

                const totalLessons = totalLessonsResult?.totalLessons || 0;
                const completedLessons = completedLessonsResult?.completedLessons || 0;
                const progressPercentage =
                    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

                return {
                    id: course.courseId,
                    name: course.courseName,
                    description: course.courseDescription,
                    thumbnailUrl: course.courseThumbnailUrl,
                    slug: course.courseSlug,
                    totalLessons,
                    completedLessons,
                    progressPercentage,
                };
            }),
        );

        // Filter out any null results
        const validCoursesWithProgress = coursesWithProgress.filter(
            (course): course is NonNullable<typeof course> => course !== null,
        );

        return {
            success: true,
            studentId,
            courses: validCoursesWithProgress,
            summary: {
                totalEnrolledCourses: validCoursesWithProgress.length,
                averageProgress:
                    validCoursesWithProgress.length > 0
                        ? Math.round(
                            validCoursesWithProgress.reduce(
                                (sum, course) => sum + course.progressPercentage,
                                0,
                            ) / validCoursesWithProgress.length,
                        )
                        : 0,
                totalLessons: validCoursesWithProgress.reduce(
                    (sum, course) => sum + course.totalLessons,
                    0,
                ),
                totalCompletedLessons: validCoursesWithProgress.reduce(
                    (sum, course) => sum + course.completedLessons,
                    0,
                ),
            },
        };
    } catch (error) {
        console.error("Error fetching agent courses progress:", error);
        return {
            success: false,
            studentId,
            courses: [],
            summary: {
                totalEnrolledCourses: 0,
                averageProgress: 0,
                totalLessons: 0,
                totalCompletedLessons: 0,
            },
        };
    }
}

export async function getAgentAnalytics(request: Request, id: string): Promise<AgentAnalytics> {
    // promise all the other ones 
    try {

        const { success, studentId, courses, summary } = await getAgentCoursesProgress(request, id);
        if (!success) {
            throw new Error("Failed to fetch agent analytics");
        }
        return { courseCompletionAnalytics: { success, studentId, courses, summary } };
    } catch (error) {
        console.error("Error fetching agent analytics:", error);
        return { courseCompletionAnalytics: { success: false, studentId: id, courses: [], summary: { totalEnrolledCourses: 0, averageProgress: 0, totalLessons: 0, totalCompletedLessons: 0 } } };
    }
}