import { Trash2 } from "lucide-react";
import { DeleteDialog } from "~/components/global/admin/delete-dialog";

interface DeleteModuleProps {
	moduleSlug: string;
	courseSlug: string;
	moduleName: string;
	className?: string;
}

export function DeleteModule({
	moduleSlug,
	courseSlug,
	moduleName,
	className = "",
}: DeleteModuleProps) {
	return (
		<DeleteDialog
			resourceRoute="/resource/module"
			hiddenInputs={[
				{ name: "moduleSlug", value: moduleSlug },
				{ name: "courseSlug", value: courseSlug },
				{ name: "intent", value: "delete-module" },
			]}
			title="Delete Module"
			description={`Are you sure you want to delete the module "${moduleName}"? This action cannot be undone and will also delete all lessons within this module.`}
			trigger={
				<div className="flex items-center gap-2 cursor-pointer">
					<span className="text-red-500">Delete Module</span>
					<Trash2 className="h-4 w-4 text-red-500" />
				</div>
			}
		/>
	);
}
