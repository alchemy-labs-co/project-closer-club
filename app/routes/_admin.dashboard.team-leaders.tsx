import { useRouteLoaderData } from "react-router";
import { TeamLeadersList } from "~/components/features/team-leaders/team-leaders-list";
import { GetAllTeamLeaders } from "~/lib/admin/data-access/team-leader/team-leaders.server";
import type { Route } from "./+types/_admin.dashboard.team-leaders";

export async function loader({ request }: Route.LoaderArgs) {
	const { success, teamLeaders } = await GetAllTeamLeaders(request);
	if (!success) {
		return { teamLeaders: [] };
	}
	return { teamLeaders };
}

export function useTeamLeadersLoaderData() {
	const data = useRouteLoaderData<typeof loader>(
		"routes/_admin.dashboard.team-leaders"
	);
	if (!data)
		throw new Error(
			"Cannot use team leaders loader data if the route is not a child of the team leaders route"
		);
	return data;
}
export default function Page() {
	return (
		<div className="flex flex-col gap-4 h-full overflow-hidden py-4 [scrollbar-width:thin]">
			<TeamLeadersList />
		</div>
	);
}
