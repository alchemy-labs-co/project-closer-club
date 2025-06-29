import { redirect } from "react-router";
import { isAdminLoggedIn } from "~/lib/auth/auth.server";
import { getCourseBySlug } from "../courses.server";
import { getModuleBySlug } from "../modules/modules.server";
import {
	lessonsTable,
	quizzesTable,
	attachmentsTable,
	type Segment,
	type Attachment,
} from "~/db/schema";
import type { Quiz } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import db from "~/db/index.server";

export async function getLessonBySlug(
	request: Request,
	lessonSlug: string,
	moduleSlug: string,
	courseSlug: string,
): Promise<{ success: boolean; lesson: Segment | null }> {
	const { isLoggedIn } = await isAdminLoggedIn(request);
	if (!isLoggedIn) {
		throw redirect("/admin/login");
	}

	try {
		const { course } = await getCourseBySlug(request, courseSlug);

		if (!course) {
			throw redirect("/dashboard/courses");
		}

		const { module } = await getModuleBySlug(request, moduleSlug, courseSlug);
		if (!module) {
			throw redirect(`/dashboard/courses/${courseSlug}/${moduleSlug}`);
		}

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
		console.error("Error fetching lesson by slug:", error);
		return { success: false, lesson: null };
	}
}

export async function getAttachmentsForLesson(
	request: Request,
	lessonSlug: string,
	moduleSlug: string,
	courseSlug: string,
): Promise<{ success: boolean; attachments: Attachment[] | null }> {
	const { isLoggedIn } = await isAdminLoggedIn(request);
	if (!isLoggedIn) {
		throw redirect("/admin/login");
	}

	try {
		const { lesson } = await getLessonBySlug(
			request,
			lessonSlug,
			moduleSlug,
			courseSlug,
		);
		if (!lesson) {
			throw redirect(`/dashboard/courses/${courseSlug}/${moduleSlug}`);
		}

		const attachments = await db
			.select()
			.from(attachmentsTable)
			.where(eq(attachmentsTable.lessonId, lesson.id));
		return { success: true, attachments };
	} catch (error) {
		console.error("Error fetching attachments for lesson:", error);
		return { success: false, attachments: null };
	}
}

export async function getQuizzesForLesson(
	request: Request,
	lessonSlug: string,
	moduleSlug: string,
	courseSlug: string,
): Promise<{ success: boolean; quizzes: Quiz[] | null }> {
	const { isLoggedIn } = await isAdminLoggedIn(request);
	if (!isLoggedIn) {
		throw redirect("/admin/login");
	}

	try {
		const { lesson } = await getLessonBySlug(
			request,
			lessonSlug,
			moduleSlug,
			courseSlug,
		);
		if (!lesson) {
			throw redirect(`/dashboard/courses/${courseSlug}/${moduleSlug}`);
		}

		const quizzes = await db
			.select()
			.from(quizzesTable)
			.where(eq(quizzesTable.lessonId, lesson.id));
		return { success: true, quizzes };
	} catch (error) {
		console.error("Error fetching quizzes for lesson:", error);
		return { success: false, quizzes: null };
	}
}
