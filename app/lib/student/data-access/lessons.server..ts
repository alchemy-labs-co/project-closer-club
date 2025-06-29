import { and, eq } from "drizzle-orm";
import { redirect } from "react-router";
import db from "~/db/index.server";
import { lessonsTable, modulesTable, quizzesTable, type Quiz } from "~/db/schema";
import { isAgentLoggedIn } from "~/lib/auth/auth.server";


export async function getLessonBySlug(
	request: Request,
	moduleSlug: string,
	lessonSlug: string,
	courseSlug: string,
) {
	const { isLoggedIn } = await isAgentLoggedIn(request);
	if (!isLoggedIn) {
		throw redirect("/login");
	}

	try {
		// get the module id from the module slug
		const [module] = await db
			.select()
			.from(modulesTable)
			.where(eq(modulesTable.slug, moduleSlug));

		const [lesson] = await db
			.select()
			.from(lessonsTable)
			.where(
				and(
					eq(lessonsTable.slug, lessonSlug),
					eq(lessonsTable.moduleId, module.id),
				),
			)
			.limit(1);

		return { success: true, lesson };
	} catch (error) {
		console.error("Error fetching lesson from database:", error);
		return { success: false, lesson: null };
	}
}


export async function getQuizzesForLesson(request: Request, moduleSlug: string, lessonSlug: string, courseSlug: string): Promise<{ quizzes: Quiz | null }> {
	const { isLoggedIn } = await isAgentLoggedIn(request);

	if (!isLoggedIn) {
		throw redirect("/login");
	}

	try {
		const { lesson } = await getLessonBySlug(request, moduleSlug, lessonSlug, courseSlug);

		if (!lesson) {
			throw redirect(`/student/courses`);
		}

		const [quizzes] = await db.select().from(quizzesTable).where(eq(quizzesTable.lessonId, lesson.id));
		if (!quizzes) {
			return { quizzes: null };
		}
		// dto remove the correctAnswerIndex from the network response
		const quizzesDto = {
			...quizzes,
			questions: quizzes.questions.map((question) => {
				return { ...question, correctAnswerIndex: -1 };
			}),
		}
		return { quizzes: quizzesDto };
	} catch (error) {
		console.error("Error fetching quizzes for lesson:", error);
		return { quizzes: null };
	}
}