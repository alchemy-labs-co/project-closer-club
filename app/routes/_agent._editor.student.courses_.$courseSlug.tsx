import { redirect } from "react-router";
import { getResumeableLessonForCourse } from "~/lib/student/data-access/courses.server";
import type { Route } from "./+types/_agent._editor.student.courses_.$courseSlug";

export async function loader({ params, request }: Route.LoaderArgs) {
	const { courseSlug } = params;
	if (!courseSlug) {
		throw redirect("/student/courses");
	}

	// get resumeable lesson for the course (last completed or next accessible)
	const { lesson, module } = await getResumeableLessonForCourse(
		request,
		courseSlug,
	);

	return redirect(
		`/student/courses/${courseSlug}/${module.slug}/${lesson.slug}`,
	);
}
