import { useRouteLoaderData } from "react-router";
import { CoursesList } from "~/components/features/courses/courses/courses-list";
import { CreateCourse } from "~/components/features/courses/courses/create-course";
import { getAllCourses } from "~/lib/admin/data-access/courses.server";
import type { Route } from "./+types/_admin.dashboard.courses";
export async function loader({ request }: Route.LoaderArgs) {
	const courses = await getAllCourses(request);
	if (!courses.success || !courses.courses) {
		return { courses: [] };
	}
	return { courses: courses.courses };
}

export function useCoursesLoaderData() {
	const data = useRouteLoaderData<typeof loader>(
		"routes/_admin.dashboard.courses",
	);
	if (!data) {
		throw new Error(
			"Courses Loader needs to be used within a CoursesLoader context, the route needs to be a child of the Courses route",
		);
	}
	return data;
}
export default function Page() {
	return (
		<div className="flex flex-col gap-8 md:gap-12 h-full overflow-y-auto py-4">
			<div className="flex flex-row justify-between items-center w-full ">
				<h1>Courses</h1>
				<CreateCourse />
			</div>
			<CoursesList />
		</div>
	);
}
