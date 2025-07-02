import { and, eq, asc, gt } from "drizzle-orm";
import db from "~/db/index.server";
import {
	lessonsTable,
	modulesTable,
	coursesTable,
	completedQuizAssignmentsTable,
} from "~/db/schema";

export interface LessonAccessResult {
	canAccess: boolean;
	reason?: string;
	redirectTo?: string;
	requiredLessonSlug?: string;
}

/**
 * Main function to check if a student can access a specific lesson
 * Based on quiz completion of the previous lesson and module accessibility
 */
export async function canAccessLesson(
	studentId: string,
	courseSlug: string,
	moduleSlug: string,
	lessonSlug: string,
): Promise<LessonAccessResult> {
	try {
		// First check if the module is accessible
		const moduleAccessResult = await canAccessModule(
			studentId,
			courseSlug,
			moduleSlug,
		);

		if (!moduleAccessResult.canAccess) {
			return moduleAccessResult; // Return module access denial
		}

		// Get the lesson they're trying to access
		const targetLesson = await getLessonBySlug(
			courseSlug,
			moduleSlug,
			lessonSlug,
		);

		if (!targetLesson) {
			return {
				canAccess: false,
				reason: "Lesson not found",
			};
		}

		// If it's the first lesson (orderIndex = 0), always allow access (since module is already accessible)
		if (Number.parseInt(targetLesson.orderIndex) === 0) {
			return {
				canAccess: true,
				reason: "First lesson in accessible module",
			};
		}

		// Get the previous lesson (orderIndex - 1)
		const previousLessonIndex = Number.parseInt(targetLesson.orderIndex) - 1;
		const previousLesson = await getLessonByOrderIndex(
			targetLesson.moduleId,
			previousLessonIndex,
		);

		if (!previousLesson) {
			return {
				canAccess: false,
				reason: "Previous lesson not found",
			};
		}

		// Check if student completed the quiz for the previous lesson
		const hasCompletedPreviousQuiz = await hasCompletedLessonQuiz(
			studentId,
			previousLesson.id,
		);

		if (!hasCompletedPreviousQuiz) {
			return {
				canAccess: false,
				reason: "Previous lesson quiz not completed",
				redirectTo: `${courseSlug}/${moduleSlug}/${previousLesson.slug}`,
				requiredLessonSlug: previousLesson.slug,
			};
		}

		return {
			canAccess: true,
			reason: "Previous lesson quiz completed",
		};
	} catch (error) {
		console.error("Error checking lesson access:", error);
		return {
			canAccess: false,
			reason: "Error checking access permissions",
		};
	}
}

/**
 * Check if student has completed the quiz for a specific lesson
 */
export async function hasCompletedLessonQuiz(
	studentId: string,
	lessonId: string,
): Promise<boolean> {
	try {
		const [completedQuiz] = await db
			.select()
			.from(completedQuizAssignmentsTable)
			.where(
				and(
					eq(completedQuizAssignmentsTable.studentId, studentId),
					eq(completedQuizAssignmentsTable.lessonId, lessonId),
				),
			)
			.limit(1);

		return !!completedQuiz;
	} catch (error) {
		console.error("Error checking quiz completion:", error);
		return false;
	}
}

/**
 * Get lesson by course, module, and lesson slugs
 */
async function getLessonBySlug(
	courseSlug: string,
	moduleSlug: string,
	lessonSlug: string,
) {
	try {
		const [lesson] = await db
			.select({
				id: lessonsTable.id,
				slug: lessonsTable.slug,
				orderIndex: lessonsTable.orderIndex,
				moduleId: lessonsTable.moduleId,
				name: lessonsTable.name,
			})
			.from(lessonsTable)
			.innerJoin(modulesTable, eq(lessonsTable.moduleId, modulesTable.id))
			.innerJoin(coursesTable, eq(modulesTable.courseId, coursesTable.id))
			.where(
				and(
					eq(coursesTable.slug, courseSlug),
					eq(modulesTable.slug, moduleSlug),
					eq(lessonsTable.slug, lessonSlug),
				),
			)
			.limit(1);

		return lesson;
	} catch (error) {
		console.error("Error getting lesson by slug:", error);
		return null;
	}
}

/**
 * Get lesson by module ID and order index
 */
async function getLessonByOrderIndex(moduleId: string, orderIndex: number) {
	try {
		const [lesson] = await db
			.select({
				id: lessonsTable.id,
				slug: lessonsTable.slug,
				orderIndex: lessonsTable.orderIndex,
				moduleId: lessonsTable.moduleId,
				name: lessonsTable.name,
			})
			.from(lessonsTable)
			.where(
				and(
					eq(lessonsTable.moduleId, moduleId),
					eq(lessonsTable.orderIndex, orderIndex.toString()),
				),
			)
			.limit(1);

		return lesson;
	} catch (error) {
		console.error("Error getting lesson by order index:", error);
		return null;
	}
}

/**
 * Get all completed lessons for a student in a specific module
 */
export async function getCompletedLessonsInModule(
	studentId: string,
	moduleId: string,
): Promise<number[]> {
	try {
		const completedLessons = await db
			.select({
				orderIndex: lessonsTable.orderIndex,
			})
			.from(completedQuizAssignmentsTable)
			.innerJoin(
				lessonsTable,
				eq(completedQuizAssignmentsTable.lessonId, lessonsTable.id),
			)
			.where(
				and(
					eq(completedQuizAssignmentsTable.studentId, studentId),
					eq(lessonsTable.moduleId, moduleId),
				),
			);

		return completedLessons.map((lesson) => Number.parseInt(lesson.orderIndex));
	} catch (error) {
		console.error("Error getting completed lessons:", error);
		return [];
	}
}

/**
 * Get the next accessible lesson for a student in a module
 */
export async function getNextAccessibleLesson(
	studentId: string,
	courseSlug: string,
	moduleSlug: string,
): Promise<{ slug: string; name: string; orderIndex: number } | null> {
	try {
		// Get module info
		const [module] = await db
			.select({ id: modulesTable.id })
			.from(modulesTable)
			.innerJoin(coursesTable, eq(modulesTable.courseId, coursesTable.id))
			.where(
				and(
					eq(coursesTable.slug, courseSlug),
					eq(modulesTable.slug, moduleSlug),
				),
			)
			.limit(1);

		if (!module) return null;

		// Get completed lessons
		const completedLessons = await getCompletedLessonsInModule(
			studentId,
			module.id,
		);

		// Get all lessons in order
		const allLessons = await db
			.select({
				slug: lessonsTable.slug,
				name: lessonsTable.name,
				orderIndex: lessonsTable.orderIndex,
			})
			.from(lessonsTable)
			.where(eq(lessonsTable.moduleId, module.id))
			.orderBy(asc(lessonsTable.orderIndex));

		// Find the first lesson that's not completed
		for (const lesson of allLessons) {
			const orderIndex = Number.parseInt(lesson.orderIndex);

			// If it's the first lesson (0) or previous lesson is completed
			if (orderIndex === 0 || completedLessons.includes(orderIndex - 1)) {
				// Check if this lesson is already completed
				if (!completedLessons.includes(orderIndex)) {
					return {
						slug: lesson.slug,
						name: lesson.name,
						orderIndex,
					};
				}
			}
		}

		return null; // All lessons completed
	} catch (error) {
		console.error("Error getting next accessible lesson:", error);
		return null;
	}
}

/**
 * Check if student can access a module (based on previous module completion)
 */
export async function canAccessModule(
	studentId: string,
	courseSlug: string,
	moduleSlug: string,
): Promise<LessonAccessResult> {
	try {
		// Get the module they're trying to access
		const [targetModule] = await db
			.select({
				id: modulesTable.id,
				orderIndex: modulesTable.orderIndex,
				courseId: modulesTable.courseId,
			})
			.from(modulesTable)
			.innerJoin(coursesTable, eq(modulesTable.courseId, coursesTable.id))
			.where(
				and(
					eq(coursesTable.slug, courseSlug),
					eq(modulesTable.slug, moduleSlug),
				),
			)
			.limit(1);

		if (!targetModule) {
			return { canAccess: false, reason: "Module not found" };
		}

		// If it's the first module (orderIndex = 0), always allow access
		if (Number.parseInt(targetModule.orderIndex) === 0) {
			return { canAccess: true, reason: "First module is always accessible" };
		}

		// Get previous module
		const previousModuleIndex = Number.parseInt(targetModule.orderIndex) - 1;
		const [previousModule] = await db
			.select({
				id: modulesTable.id,
				slug: modulesTable.slug,
			})
			.from(modulesTable)
			.where(
				and(
					eq(modulesTable.courseId, targetModule.courseId),
					eq(modulesTable.orderIndex, previousModuleIndex.toString()),
				),
			)
			.limit(1);

		if (!previousModule) {
			return { canAccess: false, reason: "Previous module not found" };
		}

		// Check if all lessons in previous module are completed
		const hasCompletedPreviousModule = await hasCompletedAllLessonsInModule(
			studentId,
			previousModule.id,
		);

		if (!hasCompletedPreviousModule) {
			return {
				canAccess: false,
				reason: "Previous module not completed",
				redirectTo: `${courseSlug}/${previousModule.slug}`,
			};
		}

		return { canAccess: true, reason: "Previous module completed" };
	} catch (error) {
		console.error("Error checking module access:", error);
		return { canAccess: false, reason: "Error checking access permissions" };
	}
}

/**
 * Check if student has completed all lessons in a module
 */
async function hasCompletedAllLessonsInModule(
	studentId: string,
	moduleId: string,
): Promise<boolean> {
	try {
		// Get total lessons in module
		const [totalLessons] = await db
			.select({ count: lessonsTable.id })
			.from(lessonsTable)
			.where(eq(lessonsTable.moduleId, moduleId));

		// Get completed lessons count
		const completedLessons = await getCompletedLessonsInModule(
			studentId,
			moduleId,
		);

		// TODO: Implement proper count query
		const allLessons = await db
			.select()
			.from(lessonsTable)
			.where(eq(lessonsTable.moduleId, moduleId));

		return completedLessons.length === allLessons.length;
	} catch (error) {
		console.error("Error checking module completion:", error);
		return false;
	}
}

/**
 * Get the next lesson after the current lesson (can span across modules)
 */
export async function getNextLessonAfterCurrent(
	studentId: string,
	courseSlug: string,
	moduleSlug: string,
	lessonSlug: string,
): Promise<{
	courseSlug: string;
	moduleSlug: string;
	lessonSlug: string;
	lessonName: string;
} | null> {
	try {
		// Get current lesson info
		const currentLesson = await getLessonBySlug(
			courseSlug,
			moduleSlug,
			lessonSlug,
		);
		if (!currentLesson) return null;

		// Try to find next lesson in current module
		const nextLessonInModule = await db
			.select({
				slug: lessonsTable.slug,
				name: lessonsTable.name,
				orderIndex: lessonsTable.orderIndex,
			})
			.from(lessonsTable)
			.where(
				and(
					eq(lessonsTable.moduleId, currentLesson.moduleId),
					gt(lessonsTable.orderIndex, currentLesson.orderIndex),
				),
			)
			.orderBy(asc(lessonsTable.orderIndex))
			.limit(1);

		if (nextLessonInModule.length > 0) {
			return {
				courseSlug,
				moduleSlug,
				lessonSlug: nextLessonInModule[0].slug,
				lessonName: nextLessonInModule[0].name,
			};
		}

		// No more lessons in current module, try next module
		// Get course info to find next module
		const [course] = await db
			.select({ id: coursesTable.id })
			.from(coursesTable)
			.where(eq(coursesTable.slug, courseSlug))
			.limit(1);

		if (!course) return null;

		// Get current module info
		const [currentModule] = await db
			.select({
				id: modulesTable.id,
				orderIndex: modulesTable.orderIndex,
			})
			.from(modulesTable)
			.where(
				and(
					eq(modulesTable.courseId, course.id),
					eq(modulesTable.slug, moduleSlug),
				),
			)
			.limit(1);

		if (!currentModule) return null;

		// Find next module
		const [nextModule] = await db
			.select({
				id: modulesTable.id,
				slug: modulesTable.slug,
				orderIndex: modulesTable.orderIndex,
			})
			.from(modulesTable)
			.where(
				and(
					eq(modulesTable.courseId, course.id),
					gt(modulesTable.orderIndex, currentModule.orderIndex),
				),
			)
			.orderBy(asc(modulesTable.orderIndex))
			.limit(1);

		if (!nextModule) return null; // No more modules

		// Check if student can access the next module
		const moduleAccessResult = await canAccessModule(
			studentId,
			courseSlug,
			nextModule.slug,
		);
		if (!moduleAccessResult.canAccess) return null;

		// Get first lesson in next module
		const [firstLessonInNextModule] = await db
			.select({
				slug: lessonsTable.slug,
				name: lessonsTable.name,
			})
			.from(lessonsTable)
			.where(eq(lessonsTable.moduleId, nextModule.id))
			.orderBy(asc(lessonsTable.orderIndex))
			.limit(1);

		if (!firstLessonInNextModule) return null;

		return {
			courseSlug,
			moduleSlug: nextModule.slug,
			lessonSlug: firstLessonInNextModule.slug,
			lessonName: firstLessonInNextModule.name,
		};
	} catch (error) {
		console.error("Error getting next lesson:", error);
		return null;
	}
}
