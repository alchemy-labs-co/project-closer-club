import { and, asc, count, eq, exists, desc, gt } from "drizzle-orm";
import { redirect } from "react-router";
import db from "~/db/index.server";
import {
	coursesTable,
	lessonsTable,
	modulesTable,
	studentCoursesTable,
	completedQuizAssignmentsTable,
	type Segment,
} from "~/db/schema";
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
export async function getModulesAndLessonsForCourse(
	request: Request,
	courseSlug: string,
) {
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
}

export async function getModulesForCourse(
	request: Request,
	courseSlug: string,
) {
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
			.where(eq(lessonsTable.moduleId, module.id))
			.orderBy(asc(lessonsTable.orderIndex));
		(module as any).lessons = lessons;
	}

	return { modules };
}

export async function getFirstLessonForCourse(
	request: Request,
	courseSlug: string,
) {
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

export async function getTotalLessonsCount(request: Request, courseId: string) {
	const { isLoggedIn } = await isAgentLoggedIn(request);
	if (!isLoggedIn) {
		throw redirect("/login");
	}

	const [lessons] = await db
		.select({
			count: count(),
		})
		.from(lessonsTable)
		.leftJoin(modulesTable, eq(lessonsTable.moduleId, modulesTable.id))
		.where(eq(modulesTable.courseId, courseId));

	return lessons.count ?? 0;
}

// chrose potentially store in redis to reduce db calls.

export async function getResumeableLessonForCourse(
	request: Request,
	courseSlug: string,
) {
	const { isLoggedIn, student } = await isAgentLoggedIn(request);
	if (!isLoggedIn || !student) {
		throw redirect("/login");
	}

	// Get the course
	const [course] = await db
		.select()
		.from(coursesTable)
		.where(eq(coursesTable.slug, courseSlug));

	if (!course) {
		throw redirect("/student/courses");
	}

	// Get all modules for the course (ordered)
	const modules = await db
		.select()
		.from(modulesTable)
		.where(eq(modulesTable.courseId, course.id))
		.orderBy(asc(modulesTable.orderIndex));

	// Get all completed lessons for this student in this course
	const completedLessons = await db
		.select({
			lessonId: lessonsTable.id,
			orderIndex: lessonsTable.orderIndex,
			moduleId: lessonsTable.moduleId,
			lessonSlug: lessonsTable.slug,
			moduleSlug: modulesTable.slug,
			moduleOrderIndex: modulesTable.orderIndex,
		})
		.from(completedQuizAssignmentsTable)
		.innerJoin(
			lessonsTable,
			eq(completedQuizAssignmentsTable.lessonId, lessonsTable.id),
		)
		.innerJoin(modulesTable, eq(lessonsTable.moduleId, modulesTable.id))
		.where(
			and(
				eq(completedQuizAssignmentsTable.studentId, student.id),
				eq(modulesTable.courseId, course.id),
			),
		)
		.orderBy(asc(modulesTable.orderIndex), asc(lessonsTable.orderIndex));

	// If there are completed lessons, find the next accessible lesson
	if (completedLessons.length > 0) {
		// Sort by module order, then by lesson order to find the truly last completed lesson
		const lastCompletedLesson = completedLessons.reduce((latest, current) => {
			const latestModuleOrder = parseInt(latest.moduleOrderIndex);
			const currentModuleOrder = parseInt(current.moduleOrderIndex);

			if (currentModuleOrder > latestModuleOrder) {
				return current;
			} else if (currentModuleOrder === latestModuleOrder) {
				const latestLessonOrder = parseInt(latest.orderIndex);
				const currentLessonOrder = parseInt(current.orderIndex);
				return currentLessonOrder > latestLessonOrder ? current : latest;
			}
			return latest;
		});

		// Try to find the next lesson in the same module
		const nextLessonInModule = await db
			.select({
				lesson: lessonsTable,
				module: modulesTable,
			})
			.from(lessonsTable)
			.innerJoin(modulesTable, eq(lessonsTable.moduleId, modulesTable.id))
			.where(
				and(
					eq(lessonsTable.moduleId, lastCompletedLesson.moduleId),
					gt(lessonsTable.orderIndex, lastCompletedLesson.orderIndex),
				),
			)
			.orderBy(asc(lessonsTable.orderIndex))
			.limit(1);

		if (nextLessonInModule.length > 0) {
			return {
				lesson: nextLessonInModule[0].lesson,
				module: nextLessonInModule[0].module,
			};
		}

		// If no next lesson in current module, find first lesson in next module
		const currentModuleOrderIndex = parseInt(
			lastCompletedLesson.moduleOrderIndex,
		);
		const nextModule = modules.find(
			(m) => parseInt(m.orderIndex) > currentModuleOrderIndex,
		);

		if (nextModule) {
			const [firstLessonInNextModule] = await db
				.select()
				.from(lessonsTable)
				.where(eq(lessonsTable.moduleId, nextModule.id))
				.orderBy(asc(lessonsTable.orderIndex))
				.limit(1);

			if (firstLessonInNextModule) {
				return {
					lesson: firstLessonInNextModule,
					module: nextModule,
				};
			}
		}

		// If all lessons are completed, return the last lesson in the course
		const lastModule = modules[modules.length - 1];
		const [lastLesson] = await db
			.select()
			.from(lessonsTable)
			.where(eq(lessonsTable.moduleId, lastModule.id))
			.orderBy(desc(lessonsTable.orderIndex))
			.limit(1);

		if (lastLesson) {
			return {
				lesson: lastLesson,
				module: lastModule,
			};
		}
	}

	// If no lessons are completed, return the first lesson (fallback to existing behavior)
	return getFirstLessonForCourse(request, courseSlug);
}
