import { useRouteLoaderData } from "react-router";
import { LeadsList } from "~/components/features/leads/leads-list";
import { GetAllLeads } from "~/lib/admin/data-access/leads/leads.server";
import type { Route } from "./+types/_admin.dashboard.leads";

export async function loader({ request }: Route.LoaderArgs) {
	const { success, leads } = await GetAllLeads(request);
	if (!success) {
		return { leads: [] };
	}
	return { leads };
}

export function useLeadsLoaderData() {
	const data = useRouteLoaderData<typeof loader>(
		"routes/_admin.dashboard.leads",
	);
	if (!data)
		throw new Error(
			"Cannot use leads loader data if the route is not a child of the leads route",
		);
	return data;
}

export default function Page() {
	return (
		<div className="flex flex-col gap-4 h-full overflow-hidden py-4 [scrollbar-width:thin]">
			<LeadsList />
		</div>
	);
}