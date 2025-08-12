import type { Route } from "./+types/_team.team.analytics";
import { TeamAnalyticsDataTable } from "~/components/features/analytics/team-analytics-data-table";
import { getTeamLeaderAnalytics } from "~/lib/team-leaders/data-access/analytics/team-analytics.server";

export async function loader({ request }: Route.LoaderArgs) {
	const analytics = await getTeamLeaderAnalytics(request);
	return { analytics };
}

export default function TeamAnalytics({ loaderData }: Route.ComponentProps) {
	const { analytics } = loaderData;

	return (
		<div className="flex flex-col gap-6 p-6 h-full">
			<div className="flex flex-col gap-2">
				<h1 className="text-2xl font-bold">Analytics Dashboard</h1>
				<p className="text-muted-foreground">
					Monitor your team's performance and progress
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<div className="bg-white rounded-lg border p-6">
					<h3 className="text-sm font-medium text-muted-foreground">
						Total Agents
					</h3>
					<p className="text-2xl font-bold">
						{analytics.teamOverview.totalAgents}
					</p>
				</div>

				<div className="bg-white rounded-lg border p-6">
					<h3 className="text-sm font-medium text-muted-foreground">
						Active Agents
					</h3>
					<p className="text-2xl font-bold">
						{analytics.teamOverview.activeAgents}
					</p>
				</div>

				<div className="bg-white rounded-lg border p-6">
					<h3 className="text-sm font-medium text-muted-foreground">
						Total Courses
					</h3>
					<p className="text-2xl font-bold">
						{analytics.teamOverview.totalCourses}
					</p>
				</div>

				<div className="bg-white rounded-lg border p-6">
					<h3 className="text-sm font-medium text-muted-foreground">
						Average Progress
					</h3>
					<p className="text-2xl font-bold">
						{analytics.teamOverview.averageProgress}%
					</p>
				</div>
			</div>

			<div className="bg-white rounded-lg border p-6 flex-1 overflow-hidden">
				<h3 className="text-lg font-semibold mb-4">Agent Performance</h3>
				{analytics.agentAnalytics.success &&
				analytics.agentAnalytics.agents.length > 0 ? (
					<TeamAnalyticsDataTable agentData={analytics.agentAnalytics.agents} />
				) : (
					<p className="text-muted-foreground">
						No agents found or unable to load agent analytics.
					</p>
				)}
			</div>
		</div>
	);
}
