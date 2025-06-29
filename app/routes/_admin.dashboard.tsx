import { Outlet, useRouteLoaderData } from "react-router";
import { GetCoursesAnalytics } from "~/lib/admin/data-access/courses.server";
import { GetStudentsAnalytics } from "~/lib/admin/data-access/students.server";
import type { Route } from "./+types/_admin.dashboard";

export async function loader({ request }: Route.LoaderArgs) {
	// get analytics data
	const {
		success,
		totalStudentsCount,
		activeStudentsCount,
		inactiveStudentsCount,
	} = await GetStudentsAnalytics(request);
	const {
		success: coursesSuccess,
		totalCoursesCount,
		totalPublicCourses,
		totalPrivateCourses,
	} = await GetCoursesAnalytics(request);
	if (!success || !coursesSuccess) {
		return {
			totalStudentsCount: 0,
			activeStudentsCount: 0,
			inactiveStudentsCount: 0,
			totalCoursesCount: 0,
			totalPublicCourses: 0,
			totalPrivateCourses: 0,
		};
	}
	return {
		totalStudentsCount,
		activeStudentsCount,
		inactiveStudentsCount,
		totalCoursesCount,
		totalPublicCourses,
		totalPrivateCourses,
	};
}

export function useDashboardLoaderData() {
	const data = useRouteLoaderData<typeof loader>("routes/_admin.dashboard");
	if (!data) {
		throw new Error(
			"Dashboard Loader needs to be used within a DashboardLoader context, the route needs to be a child of the Dashboard route",
		);
	}
	return data;
}
export default function Page() {
	return <Outlet />;
}
