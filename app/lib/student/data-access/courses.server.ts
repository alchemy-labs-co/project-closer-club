import { and, asc, eq, exists } from "drizzle-orm";
import { redirect } from "react-router";
import db from "~/db/index.server";
import { coursesTable, lessonsTable, modulesTable, studentCoursesTable, type Segment } from "~/db/schema";
import { isAgentLoggedIn } from "~/lib/auth/auth.server";

export async function getCourseBySlug(request: Request, slug: string) {
	const { isLoggedIn, student } = await isAgentLoggedIn(request);
	if (!isLoggedIn || !student) {
		throw redirect("/login");
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
									eq(studentCoursesTable.studentId, student.id),
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

// get modules & lessons for a course
export async function getModulesAndLessonsForCourse(request: Request, courseSlug: string) {
	const { isLoggedIn, student } = await isAgentLoggedIn(request);
	if (!isLoggedIn || !student) {
		throw redirect("/login");
	}

	// get the course id
	const [course] = await db
		.select()
		.from(coursesTable)
		.where(eq(coursesTable.slug, courseSlug));

	// get all modules for the course
	const modules = await db
		.select()
		.from(modulesTable)
		.where(eq(modulesTable.courseId, course.id)).orderBy(asc(modulesTable.orderIndex));

	// go through each module and get all lessons
	const lessons: Segment[] = [];
	for (const module of modules) {
		const moduleLessons = await db
			.select()
			.from(lessonsTable)
			.where(eq(lessonsTable.moduleId, module.id)).orderBy(asc(lessonsTable.orderIndex));
		lessons.push(...moduleLessons);
	}
	return { modules, lessons: lessons };
}

export async function getModulesForCourse(request: Request, courseSlug: string) {
	const { isLoggedIn, student } = await isAgentLoggedIn(request);
	if (!isLoggedIn || !student) {
		throw redirect("/login");
	}

	// get the course id
	const [course] = await db
		.select()
		.from(coursesTable)
		.where(eq(coursesTable.slug, courseSlug));

	// get all modules for the course
	const modules = await db
		.select()
		.from(modulesTable)
		.where(eq(modulesTable.courseId, course.id))
		.orderBy(asc(modulesTable.orderIndex));

	// go through each module and get all lessons
	for (const module of modules) {
		const lessons = await db
			.select()
			.from(lessonsTable)
			.where(eq(lessonsTable.moduleId, module.id)).orderBy(asc(lessonsTable.orderIndex));
		(module as any).lessons = lessons;
	}

	return { modules };
}

export async function getFirstLessonForCourse(request: Request, courseSlug: string) {
	const { isLoggedIn, student } = await isAgentLoggedIn(request);
	if (!isLoggedIn || !student) {
		throw redirect("/login");
	}

	// get the course id
	const [course] = await db
		.select()
		.from(coursesTable)
		.where(eq(coursesTable.slug, courseSlug));

	// get the first module
	const [module] = await db
		.select()
		.from(modulesTable)
		.where(eq(modulesTable.courseId, course.id))
		.orderBy(asc(modulesTable.orderIndex))
		.limit(1);

	// get the first lesson		
	const [lesson] = await db
		.select()
		.from(lessonsTable)
		.where(eq(lessonsTable.moduleId, module.id))
		.orderBy(asc(lessonsTable.orderIndex))
		.limit(1);

	return { lesson, module };
}

export async function getTotalLessonsCount(courseId: string) {
	const lessons = await db
		.select({
			id: lessonsTable.id,
		})
		.from(lessonsTable)
		.leftJoin(modulesTable, eq(lessonsTable.moduleId, modulesTable.id))
		.where(eq(modulesTable.courseId, courseId));

	return lessons.length;
}
