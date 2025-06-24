import { CreateModule } from "../modules/create-module";
import { ModulesList } from "../modules/modules-list";
import { CreateSegment } from "../segments/create-segment";

interface CourseEditSidebarProps {
	isInModuleView?: boolean;
}

export function CourseEditSidebar({
	isInModuleView = false,
}: CourseEditSidebarProps) {
	return (
		<aside className="w-full md:w-64 h-full overflow-hidden bg-gray-50 md:border-r border-r-0 border-b md:border-b-0 border-gray-200 p-2 flex flex-col">
			<div className="h-full flex flex-col gap-4">
				<ModulesList />
				{isInModuleView ? <CreateSegment /> : <CreateModule />}
			</div>
		</aside>
	);
}
