import { FileText } from "lucide-react";
import { StudentEnrolledList } from "~/components/features/students/students-enrolled";
import { Separator } from "~/components/ui/separator";
import { useEditorLoaderData } from "~/routes/_admin._editor";
import type { Route } from "./+types/_admin._editor.dashboard.courses_.$slug._index";

export async function loader({ params }: Route.LoaderArgs) {
	const { slug } = params;

	return { slug };
}

export default function CourseIndex({ loaderData }: Route.ComponentProps) {
	const { modules } = useEditorLoaderData();
	const hasModules = modules.length > 0;

	return (
		<div className="flex flex-col h-full bg-gray-50 p-8 flex-1 border border-gray-200 border-l-0 border-t-0 justify-center items-center text-center">
			<div>
				<div className="flex justify-center mb-6">
					<div className="bg-primary/90-100 p-4 rounded-full">
						<FileText className="w-12 h-12 text-blue-600" />
					</div>
				</div>
				<h2 className="text-2xl font-semibold text-gray-800 mb-3">
					{hasModules ? "Select a Module" : "Create a Module to Begin"}
				</h2>
				<p className="text-gray-600 mb-6 max-w-md">
					{hasModules
						? "Choose a module from the sidebar to view and manage its lessons, or create a new module to add more content to your course."
						: "Start by creating a module from the sidebar to organize your course content. Each module represents a different section of your course."}
				</p>
				<Separator />
				<StudentEnrolledList courseSlug={loaderData.slug} />
			</div>
		</div>
	);
}
