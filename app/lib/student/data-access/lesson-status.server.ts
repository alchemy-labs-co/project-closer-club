import { and, asc, eq } from "drizzle-orm";
import db from "~/db/index.server";
import {
    completedQuizAssignmentsTable,
    coursesTable,
    lessonsTable,
    modulesTable
} from "~/db/schema";

export interface LessonStatusItem {
    lessonSlug: string;
    lessonName: string;
    orderIndex: number;
    status: 'locked' | 'completed' | 'current' | 'accessible';
    canAccess: boolean;
    icon: 'lock' | 'check' | 'play' | 'circle';
}

export interface ModuleLessonStatuses {
    moduleSlug: string;
    moduleName: string;
    lessons: LessonStatusItem[];
}

/**
 * Get lesson statuses for all lessons in a module
 * This returns a promise to be used for async loading
 */
export async function getLessonStatusesForModule(
    studentId: string,
    courseSlug: string,
    moduleSlug: string,
    currentLessonSlug?: string,
    isModuleAccessible = true
): Promise<ModuleLessonStatuses | null> {
    try {
        // Get module info
        const [module] = await db
            .select({
                id: modulesTable.id,
                name: modulesTable.name,
                slug: modulesTable.slug
            })
            .from(modulesTable)
            .innerJoin(coursesTable, eq(modulesTable.courseId, coursesTable.id))
            .where(
                and(
                    eq(coursesTable.slug, courseSlug),
                    eq(modulesTable.slug, moduleSlug)
                )
            )
            .limit(1);

        if (!module) return null;

        // Get all lessons in this module (ordered by orderIndex)
        const lessons = await db
            .select({
                id: lessonsTable.id,
                slug: lessonsTable.slug,
                name: lessonsTable.name,
                orderIndex: lessonsTable.orderIndex
            })
            .from(lessonsTable)
            .where(eq(lessonsTable.moduleId, module.id))
            .orderBy(asc(lessonsTable.orderIndex));

        // Get completed lessons for this student in this module
        const completedLessons = await db
            .select({
                lessonId: lessonsTable.id,
                orderIndex: lessonsTable.orderIndex
            })
            .from(completedQuizAssignmentsTable)
            .innerJoin(lessonsTable, eq(completedQuizAssignmentsTable.lessonId, lessonsTable.id))
            .where(
                and(
                    eq(completedQuizAssignmentsTable.studentId, studentId),
                    eq(lessonsTable.moduleId, module.id)
                )
            );

        const completedOrderIndexes = completedLessons.map(lesson =>
            parseInt(lesson.orderIndex)
        );

        // Determine status for each lesson
        const lessonStatuses: LessonStatusItem[] = lessons.map(lesson => {
            const orderIndex = parseInt(lesson.orderIndex);
            const isCompleted = completedOrderIndexes.includes(orderIndex);
            const isCurrent = lesson.slug === currentLessonSlug;

            // Lesson access logic
            let canAccess = false;
            let status: LessonStatusItem['status'] = 'locked';
            let icon: LessonStatusItem['icon'] = 'lock';

            // If module is not accessible, all lessons are locked
            if (!isModuleAccessible) {
                canAccess = false;
                status = 'locked';
                icon = 'lock';
            } else {
                // Module is accessible, apply normal lesson-level locking
                if (orderIndex === 0) {
                    // First lesson is always accessible
                    canAccess = true;
                    status = isCompleted ? 'completed' : (isCurrent ? 'current' : 'accessible');
                } else {
                    // Check if previous lesson is completed
                    const previousLessonCompleted = completedOrderIndexes.includes(orderIndex - 1);

                    if (previousLessonCompleted) {
                        canAccess = true;
                        status = isCompleted ? 'completed' : (isCurrent ? 'current' : 'accessible');
                    } else {
                        canAccess = false;
                        status = 'locked';
                    }
                }

                // Assign appropriate icon based on status
                switch (status) {
                    case 'completed':
                        icon = 'check';
                        break;
                    case 'current':
                        icon = 'play';
                        break;
                    case 'accessible':
                        icon = 'circle';
                        break;
                    case 'locked':
                    default:
                        icon = 'lock';
                        break;
                }
            }

            return {
                lessonSlug: lesson.slug,
                lessonName: lesson.name,
                orderIndex,
                status,
                canAccess,
                icon
            };
        });

        return {
            moduleSlug: module.slug,
            moduleName: module.name,
            lessons: lessonStatuses
        };

    } catch (error) {
        console.error("Error getting lesson statuses:", error);
        return null;
    }
}

/**
 * Get lesson statuses for all modules in a course
 * Useful for course overview pages
 */
export async function getLessonStatusesForCourse(
    studentId: string,
    courseSlug: string,
    currentModuleSlug?: string,
    currentLessonSlug?: string
): Promise<ModuleLessonStatuses[]> {
    try {
        // Get all modules in the course
        const modules = await db
            .select({
                id: modulesTable.id,
                slug: modulesTable.slug,
                name: modulesTable.name,
                orderIndex: modulesTable.orderIndex
            })
            .from(modulesTable)
            .innerJoin(coursesTable, eq(modulesTable.courseId, coursesTable.id))
            .where(eq(coursesTable.slug, courseSlug))
            .orderBy(asc(modulesTable.orderIndex));

        const moduleStatuses: ModuleLessonStatuses[] = [];

        // Get statuses for each module with module-level locking
        for (let i = 0; i < modules.length; i++) {
            const module = modules[i];
            const isCurrentModule = module.slug === currentModuleSlug;
            const lessonSlugToCheck = isCurrentModule ? currentLessonSlug : undefined;

            // Check if this module is accessible based on previous module completion
            let isModuleAccessible = true;

            // First module (orderIndex 0) is always accessible
            if (parseInt(module.orderIndex) > 0) {
                // Check if previous module is completed
                const previousModule = modules[i - 1];
                if (previousModule) {
                    const isPreviousModuleCompleted = await isModuleCompleted(
                        studentId,
                        previousModule.id
                    );
                    isModuleAccessible = isPreviousModuleCompleted;
                }
            }

            const moduleStatus = await getLessonStatusesForModule(
                studentId,
                courseSlug,
                module.slug,
                lessonSlugToCheck,
                isModuleAccessible // Pass module accessibility
            );

            if (moduleStatus) {
                moduleStatuses.push(moduleStatus);
            }
        }

        return moduleStatuses;
    } catch (error) {
        console.error("Error getting course lesson statuses:", error);
        return [];
    }
}

/**
 * Check if a module is completed (all lessons have completed quizzes)
 */
async function isModuleCompleted(studentId: string, moduleId: string): Promise<boolean> {
    try {
        // Get all lessons in the module
        const lessons = await db
            .select({ id: lessonsTable.id })
            .from(lessonsTable)
            .where(eq(lessonsTable.moduleId, moduleId));

        if (lessons.length === 0) {
            return true; // Empty module is considered completed
        }

        // Get completed lessons for this student in this module
        const completedLessons = await db
            .select({ lessonId: completedQuizAssignmentsTable.lessonId })
            .from(completedQuizAssignmentsTable)
            .innerJoin(lessonsTable, eq(completedQuizAssignmentsTable.lessonId, lessonsTable.id))
            .where(
                and(
                    eq(completedQuizAssignmentsTable.studentId, studentId),
                    eq(lessonsTable.moduleId, moduleId)
                )
            );

        // Module is completed if all lessons have completed quizzes
        return completedLessons.length === lessons.length;
    } catch (error) {
        console.error("Error checking module completion:", error);
        return false;
    }
}

/**
 * Get just the status for a single lesson (useful for quick checks)
 */
export async function getSingleLessonStatus(
    studentId: string,
    courseSlug: string,
    moduleSlug: string,
    lessonSlug: string
): Promise<LessonStatusItem | null> {
    try {
        const moduleStatuses = await getLessonStatusesForModule(
            studentId,
            courseSlug,
            moduleSlug,
            lessonSlug
        );

        if (!moduleStatuses) return null;

        const lessonStatus = moduleStatuses.lessons.find(
            lesson => lesson.lessonSlug === lessonSlug
        );

        return lessonStatus || null;
    } catch (error) {
        console.error("Error getting single lesson status:", error);
        return null;
    }
}

/**
 * Get progress summary for a module
 */
export async function getModuleProgress(
    studentId: string,
    courseSlug: string,
    moduleSlug: string
): Promise<{
    totalLessons: number;
    completedLessons: number;
    progressPercentage: number;
    nextAccessibleLesson?: string;
} | null> {
    try {
        const moduleStatuses = await getLessonStatusesForModule(
            studentId,
            courseSlug,
            moduleSlug
        );

        if (!moduleStatuses) return null;

        const totalLessons = moduleStatuses.lessons.length;
        const completedLessons = moduleStatuses.lessons.filter(
            lesson => lesson.status === 'completed'
        ).length;

        const progressPercentage = totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

        // Find next accessible lesson that's not completed
        const nextAccessibleLesson = moduleStatuses.lessons.find(
            lesson => lesson.canAccess && lesson.status !== 'completed'
        )?.lessonSlug;

        return {
            totalLessons,
            completedLessons,
            progressPercentage,
            nextAccessibleLesson
        };
    } catch (error) {
        console.error("Error getting module progress:", error);
        return null;
    }
} 