import { and, eq } from "drizzle-orm";
import { redirect } from "react-router";
import db from "~/db/index.server";
import { completedQuizAssignmentsTable } from "~/db/schema";
import { isAgentLoggedIn } from "~/lib/auth/auth.server";
import { getLessonBySlug } from "./lessons.server.";


export async function getCompletedAssignmentForLesson(request: Request, lessonSlug: string, moduleSlug: string, courseSlug: string) {
    const { isLoggedIn, student } = await isAgentLoggedIn(request);
    if (!isLoggedIn || !student) {
        throw redirect("/login")
    }

    try {
        const { success, lesson } = await getLessonBySlug(request, moduleSlug, lessonSlug, courseSlug);
        if (!success || !lesson) {
            return { success: false, completedAssignment: null }
        }
        const [completedAssignment] = await db.select().from(completedQuizAssignmentsTable).where(and(eq(completedQuizAssignmentsTable.lessonId, lesson.id), eq(completedQuizAssignmentsTable.studentId, student.id))).limit(1);
        return { success: true, completedAssignment: completedAssignment ?? null }
    } catch (error) {
        return { success: false, completedAssignment: null }
    }

}


