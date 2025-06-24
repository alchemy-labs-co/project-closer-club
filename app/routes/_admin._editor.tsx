import { Outlet, redirect, useParams, useRouteLoaderData } from "react-router";
import { CourseEditSidebar } from "~/components/features/courses/editor/course-edit-sidebar";
import { getAllModulesForCourse } from "~/lib/admin/data-access/modules/modules.server";
import type { Route } from "./+types/_admin._editor";

export async function loader({ request, params }: Route.LoaderArgs) {
	const { slug: courseSlug, moduleSlug } = params;
	if (!courseSlug) {
		throw redirect("/dashboard/courses");
	}
	// get all modules for that course
	const { modules } = await getAllModulesForCourse(request, courseSlug);
	return { courseSlug, moduleSlug, modules };
}

export function useEditorLoaderData() {
	const data = useRouteLoaderData<typeof loader>("routes/_admin._editor");
	if (!data) {
		throw new Error(
			"Editor Loader needs to be used within a EditorLoader context, the route needs to be a child of the Editor route"
		);
	}
	return data;
}

export default function CourseEditorLayout() {
	const params = useParams();
	const { moduleSlug } = params;

	return (
		<div className="flex flex-col-reverse gap-8 md:gap-0 md:flex-row h-full overflow-hidden">
			<CourseEditSidebar isInModuleView={!!moduleSlug} />
			<div className="flex-1">
				<Outlet />
			</div>
		</div>
	);
}
