import { DataTable } from "~/components/global/admin/data-table";
import { useAgentsLoaderData } from "~/routes/_admin.dashboard.agents";

export function AgentsList() {
	const { students } = useAgentsLoaderData();
	return <DataTable initialData={students} />;
}
