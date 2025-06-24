import { Edit3, FileText } from "lucide-react";
import { Link, redirect } from "react-router";
import { Button } from "~/components/ui/button";
import { getModuleBySlug } from "~/lib/admin/data-access/modules/modules.server";
import type { Route } from "./+types/_admin._editor.dashboard.courses_.$slug_.$moduleSlug._index";

export async function loader({ request, params }: Route.LoaderArgs) {
	const { slug: courseSlug, moduleSlug } = params;
	if (!courseSlug || !moduleSlug) {
		throw redirect("/dashboard/courses");
	}

	// Get module data to display module name
	const { module } = await getModuleBySlug(request, moduleSlug, courseSlug);
	if (!module) {
		throw redirect(`/dashboard/courses/${courseSlug}`);
	}

	return { courseSlug, moduleSlug, module };
}

export default function ModuleIndex({ loaderData }: Route.ComponentProps) {
	return (
		<div className="flex flex-col h-full bg-gray-50 p-8 flex-1 border border-gray-200 border-l-0 border-t-0 justify-center items-center text-center">
			<div>
				<div className="flex justify-center mb-6">
					<div className="bg-primary/90-100 p-4 rounded-full">
						<FileText className="w-12 h-12 text-blue-600" />
					</div>
				</div>
				<h2 className="text-2xl font-semibold text-gray-800 mb-3">
					Create a Lesson to Begin
				</h2>
				<p className="text-gray-600 mb-6 max-w-md">
					Start by creating lessons for the{" "}
					<strong>{loaderData.module.name}</strong> module. Each lesson
					represents a specific topic or video within this module.
				</p>
				<Button asChild variant="outline" size="sm">
					<Link to="edit" className="inline-flex items-center gap-2">
						<Edit3 className="h-4 w-4" />
						Edit Module
					</Link>
				</Button>
			</div>
		</div>
	);
}
