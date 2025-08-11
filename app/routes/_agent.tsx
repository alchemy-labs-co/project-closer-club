import { Suspense } from "react";
import { Outlet, redirect, useRouteLoaderData } from "react-router";
import { StudentNavbar } from "~/components/global/student/navbar";
import { CourseCardSkeleton } from "~/components/global/student/student-skeleton";
import { isAuthenticated } from "~/lib/auth/auth.server";
import { getStudentById } from "~/lib/student/data-access/students.server";
import type { Route } from "./+types/_agent";

export async function loader({ request }: Route.LoaderArgs) {
	// student auth check
	const { session } = await isAuthenticated(request);

	if (!session || session.role !== "user") {
		throw redirect("/login");
	}

	// get studentbyid
	const { student: studentById } = await getStudentById(request, session.id);
	if (!studentById) {
		throw redirect("/login");
	}
	return { student: studentById };
}

export function useStudentLayoutData() {
	const data = useRouteLoaderData<typeof loader>("routes/_agent");
	if (!data) {
		throw new Error(
			"Cannot use student layout data outside of the student layout context the route must be a child of the student layout",
		);
	}
	return data;
}

export default function StudentLayout() {
	return (
		<main>
			<StudentNavbar />
			<div className="min-h-[calc(100vh-var(--navbar-height))]">
				<Suspense fallback={<CourseCardSkeleton />}>
					<Outlet />
				</Suspense>
			</div>
		</main>
	);
}
