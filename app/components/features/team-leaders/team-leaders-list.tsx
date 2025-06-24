import { TeamLeadersDataTable } from "./team-leaders-data-table";
import { useTeamLeadersLoaderData } from "~/routes/_admin.dashboard.team-leaders";

export function TeamLeadersList() {
	const { teamLeaders } = useTeamLeadersLoaderData();
	return <TeamLeadersDataTable initialData={teamLeaders} />;
}
