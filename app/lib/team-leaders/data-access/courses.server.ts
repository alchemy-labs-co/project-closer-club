import { redirect } from "react-router";
import { eq, and, inArray, asc, count, exists } from "drizzle-orm";
import db from "~/db/index.server";
import {
    coursesTable,
    studentCoursesTable,
    modulesTable,
    lessonsTable,
    type Segment
} from "~/db/schema";
import { isTeamLeaderLoggedIn } from "~/lib/auth/auth.server";

export async function getCoursesTeamLeaderHasAccessTo(request: Request) {
    // auth check
    const { isLoggedIn, teamLeader } = await isTeamLeaderLoggedIn(request);
    if (!isLoggedIn || !teamLeader) {
        throw redirect("/team-leader/login");
    }

    try {
        // Get courses that the team leader is specifically assigned to
        const teamLeaderCourses = await db
            .select()
            .from(studentCoursesTable)
            .where(eq(studentCoursesTable.studentId, teamLeader.id));

        if (teamLeaderCourses.length === 0) {
            return { courses: [] };
        }

        // Get the actual course details for assigned courses
        const courses = await db
            .select()
            .from(coursesTable)
            .where(
                and(
                    eq(coursesTable.isPublic, true),
                    inArray(
                        coursesTable.id,
                        teamLeaderCourses.map((course) => course.courseId),
                    ),
                ),
            );

        return { courses };
    } catch (error) {
        console.error(
            `Error fetching team leader courses: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        return { courses: [] };
    }
}

export async function getCourseBySlugForTeamLeader(request: Request, slug: string) {
    const { isLoggedIn, teamLeader } = await isTeamLeaderLoggedIn(request);
    if (!isLoggedIn || !teamLeader) {
        throw redirect("/team-leader/login");
    }

    try {
        const [course] = await db
            .select()
            .from(coursesTable)
            .where(
                and(
                    eq(coursesTable.slug, slug),
                    eq(coursesTable.isPublic, true),
                    exists(
                        db
                            .select()
                            .from(studentCoursesTable)
                            .where(
                                and(
                                    eq(studentCoursesTable.studentId, teamLeader.id),
                                    eq(studentCoursesTable.courseId, coursesTable.id),
                                ),
                            ),
                    ),
                ),
            )
            .limit(1);

        return { success: true, course };
    } catch (error) {
        console.error("🔴Error fetching course from database:", error);
        return { success: false, course: null };
    }
}

export async function getModulesAndLessonsForCourseForTeamLeader(
    request: Request,
    courseSlug: string,
) {
    const { isLoggedIn, teamLeader } = await isTeamLeaderLoggedIn(request);
    if (!isLoggedIn || !teamLeader) {
        throw redirect("/team-leader/login");
    }

    try {
        // get the course id - only if team leader has access
        const [course] = await db
            .select()
            .from(coursesTable)
            .where(
                and(
                    eq(coursesTable.slug, courseSlug),
                    eq(coursesTable.isPublic, true),
                    exists(
                        db
                            .select()
                            .from(studentCoursesTable)
                            .where(
                                and(
                                    eq(studentCoursesTable.studentId, teamLeader.id),
                                    eq(studentCoursesTable.courseId, coursesTable.id),
                                ),
                            ),
                    ),
                ),
            );

        if (!course) {
            return { modules: [], lessons: [] };
        }

        // get all modules for the course
        const modules = await db
            .select()
            .from(modulesTable)
            .where(eq(modulesTable.courseId, course.id))
            .orderBy(asc(modulesTable.orderIndex));

        // go through each module and get all lessons
        const lessons: Segment[] = [];
        for (const module of modules) {
            const moduleLessons = await db
                .select()
                .from(lessonsTable)
                .where(eq(lessonsTable.moduleId, module.id))
                .orderBy(asc(lessonsTable.orderIndex));
            lessons.push(...moduleLessons);
        }
        return { modules, lessons: lessons };
    } catch (error) {
        console.error("🔴Error fetching modules and lessons:", error);
        return { modules: [], lessons: [] };
    }
}

export async function getTotalLessonsCountForTeamLeader(request: Request, courseId: string) {
    const { isLoggedIn } = await isTeamLeaderLoggedIn(request);
    if (!isLoggedIn) {
        throw redirect("/team-leader/login");
    }

    try {
        const [lessons] = await db
            .select({
                count: count(),
            })
            .from(lessonsTable)
            .leftJoin(modulesTable, eq(lessonsTable.moduleId, modulesTable.id))
            .where(eq(modulesTable.courseId, courseId));

        return lessons.count ?? 0;
    } catch (error) {
        console.error("🔴Error fetching lessons count:", error);
        return 0;
    }
}
