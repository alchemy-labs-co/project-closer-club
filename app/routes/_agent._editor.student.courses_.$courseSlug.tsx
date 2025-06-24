import { redirect } from "react-router";
import { getFirstLessonForCourse } from "~/lib/student/data-access/courses.server";
import type { Route } from "./+types/_agent._editor.student.courses_.$courseSlug";

export async function loader({ params, request }: Route.LoaderArgs) {
	const { courseSlug } = params;
	if (!courseSlug) {
		throw redirect("/student/courses");
	}

	// get first lesson for the course
	const { lesson, module } = await getFirstLessonForCourse(request, courseSlug);

	return redirect(
		`/student/courses/${courseSlug}/${module.slug}/${lesson.slug}`
	);
}
