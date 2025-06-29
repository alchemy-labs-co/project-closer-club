import { and, asc, eq } from "drizzle-orm";
import { redirect } from "react-router";
import db from "~/db/index.server";
import { modulesTable, lessonsTable } from "~/db/schema";
import { getCourseBySlug } from "../courses.server";
import { isAdminLoggedIn } from "~/lib/auth/auth.server";

export async function getAllModulesForCourse(
	request: Request,
	courseSlug: string,
) {
	const { isLoggedIn } = await isAdminLoggedIn(request);
	if (!isLoggedIn) {
		throw redirect("/admin/login");
	}

	try {
		// get course id from course slug
		const { course } = await getCourseBySlug(request, courseSlug);
		if (!course) {
			throw redirect("/dashboard/courses");
		}

		// Get all modules for the course
		const modules = await db
			.select()
			.from(modulesTable)
			.where(eq(modulesTable.courseId, course.id))
			.orderBy(asc(modulesTable.orderIndex));

		// Get lessons for each module
		const modulesWithLessons = await Promise.all(
			modules.map(async (module) => {
				const lessons = await db
					.select()
					.from(lessonsTable)
					.where(eq(lessonsTable.moduleId, module.id))
					.orderBy(asc(lessonsTable.created_at));

				return {
					...module,
					lessons,
				};
			}),
		);

		return { success: true, modules: modulesWithLessons };
	} catch (error) {
		console.error("🔴Error fetching modules from database:", error);
		return { success: false, modules: [] };
	}
}

export async function getModuleBySlug(
	request: Request,
	moduleSlug: string,
	courseSlug: string,
) {
	const { isLoggedIn } = await isAdminLoggedIn(request);
	if (!isLoggedIn) {
		throw redirect("/admin/login");
	}

	try {
		// get course id from course slug
		const { course } = await getCourseBySlug(request, courseSlug);
		if (!course) {
			throw redirect("/dashboard/courses");
		}

		const [module] = await db
			.select()
			.from(modulesTable)
			.where(
				and(
					eq(modulesTable.slug, moduleSlug),
					eq(modulesTable.courseId, course.id),
				),
			)
			.limit(1);

		if (!module) {
			return { success: false, module: null };
		}

		// Get lessons for this module
		const lessons = await db
			.select()
			.from(lessonsTable)
			.where(eq(lessonsTable.moduleId, module.id))
			.orderBy(asc(lessonsTable.created_at));

		return {
			success: true,
			module: {
				...module,
				lessons,
			},
		};
	} catch (error) {
		console.error("🔴Error fetching module from database:", error);
		return { success: false, module: null };
	}
}
