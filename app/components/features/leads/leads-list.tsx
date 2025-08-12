import { LeadsDataTable } from "./leads-data-table";
import { useLeadsLoaderData } from "~/routes/_admin.dashboard.leads";

export function LeadsList() {
	const { leads } = useLeadsLoaderData();
	return <LeadsDataTable initialData={leads} />;
}
