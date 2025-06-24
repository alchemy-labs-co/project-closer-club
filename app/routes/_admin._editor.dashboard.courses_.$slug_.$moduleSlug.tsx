import { Outlet, redirect } from "react-router";
import { getModuleBySlug } from "~/lib/admin/data-access/modules/modules.server";
import type { Route } from "./+types/_admin._editor.dashboard.courses_.$slug_.$moduleSlug";

export async function loader({ request, params }: Route.LoaderArgs) {
	const { slug: courseSlug, moduleSlug } = params;
	if (!courseSlug || !moduleSlug) {
		throw redirect("/dashboard/courses");
	}

	// Verify the module exists
	const { success, module } = await getModuleBySlug(
		request,
		moduleSlug,
		courseSlug
	);
	if (!success || !module) {
		throw redirect(`/dashboard/courses/${courseSlug}`);
	}

	return { courseSlug, moduleSlug, module };
}

export default function ModuleLayout() {
	return <Outlet />;
}
