import { redirect } from "react-router";
import {
	getCourseBySlugForTeamLeader,
	getModulesAndLessonsForCourseForTeamLeader,
} from "~/lib/team-leaders/data-access/courses.server";
import type { Route } from "./+types/_team._editor.team.courses_.$courseSlug._index";

export async function loader({ params, request }: Route.LoaderArgs) {
	const { courseSlug } = params;
	if (!courseSlug) {
		throw redirect("/team/courses");
	}

	// get the course and verify access
	const { course } = await getCourseBySlugForTeamLeader(request, courseSlug);
	if (!course) {
		throw redirect("/team/courses");
	}

	// get modules and lessons to redirect to the first lesson
	const { modules, lessons } = await getModulesAndLessonsForCourseForTeamLeader(
		request,
		courseSlug,
	);

	// Find the first module and first lesson
	if (modules.length === 0) {
		// If no modules, stay on the course overview page
		return { course, modules: [], lessons: [] };
	}

	// Get the first module (already ordered from database)
	const firstModule = modules[0];

	// Get the first lesson for this module (already ordered from database)
	const firstLesson = lessons.find((l) => l.moduleId === firstModule.id);

	if (firstLesson) {
		// Redirect to the first lesson
		throw redirect(
			`/team/courses/${courseSlug}/${firstModule.slug}/${firstLesson.slug}`,
		);
	}

	// If no lessons, stay on overview
	return { course, modules, lessons };
}
