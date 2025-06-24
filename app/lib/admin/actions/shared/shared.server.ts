import { and, eq } from "drizzle-orm";
import db from "~/db/index.server";
import { coursesTable, lessonsTable } from "~/db/schema";

export async function checkCourseSlugUnique(slug: string) {
	const [course] = await db
		.select()
		.from(coursesTable)
		.where(eq(coursesTable.slug, slug));
	return course ? false : true;
}

// For checking segment slug uniqueness within a course (legacy - DEPRECATED)
// Note: This function is deprecated as lessons now belong to modules, not courses
export async function checkSegmentSlugUnique(
	slug: string,
	courseId: string,
	currentSlug?: string,
) {
	// This function is deprecated and should not be used
	// Use checkSegmentSlugUniqueForModule instead
	throw new Error("checkSegmentSlugUnique is deprecated. Use checkSegmentSlugUniqueForModule instead.");
}

// For checking segment slug uniqueness within a module
export async function checkSegmentSlugUniqueForModule(
	slug: string,
	moduleId: string,
	currentSlug?: string,
) {
	if (currentSlug && currentSlug === slug) {
		return true;
	}
	const [segment] = await db
		.select()
		.from(lessonsTable)
		.where(
			and(eq(lessonsTable.slug, slug), eq(lessonsTable.moduleId, moduleId)),
		);
	return segment ? false : true;
}
