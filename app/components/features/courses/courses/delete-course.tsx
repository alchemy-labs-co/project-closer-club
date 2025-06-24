import { X } from "lucide-react";
import { DeleteDialog } from "~/components/global/admin/delete-dialog";

export function DeleteCourse({ courseId }: { courseId: string }) {
	return (
		<DeleteDialog
			resourceRoute="/resource/course"
			hiddenInputs={[
				{ name: "courseId", value: courseId },
				{ name: "intent", value: "delete-course" },
			]}
			title="Delete Course"
			description={
				<div className="text-sm text-gray-500">
					Are you sure you want to delete this course?
					<br />
					This action cannot be undone.
				</div>
			}
			trigger={
				<div className="h-6 w-6 cursor-pointer flex items-center justify-center rounded-full bg-red-100">
					<X className="w-4 h-4 text-red-400" />
				</div>
			}
		/>
	);
}
