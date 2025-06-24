import { useRouteLoaderData } from "react-router";
import { AgentsList } from "~/components/features/students/students-list";
import { GetAllStudents } from "~/lib/admin/data-access/students.server";
import type { Route } from "./+types/_admin.dashboard.agents";

export async function loader({ request }: Route.LoaderArgs) {
	const { success, students } = await GetAllStudents(request);
	if (!success) {
		return { students: [] };
	}
	return { students };
}

export function useAgentsLoaderData() {
	const data = useRouteLoaderData<typeof loader>(
		"routes/_admin.dashboard.agents"
	);
	if (!data)
		throw new Error(
			"Cannot use students loader data if the route is not a child of the students route"
		);
	return data;
}
export default function Page() {
	return (
		<div className="flex flex-col gap-4 h-full overflow-hidden py-4 [scrollbar-width:thin]">
			<AgentsList />
		</div>
	);
}
