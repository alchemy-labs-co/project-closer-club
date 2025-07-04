import type { Route } from "./+types/_team.team.analytics";
import { getTeamLeaderAnalytics } from "~/lib/team-leaders/data-access/analytics/team-analytics.server";

export async function loader({ request }: Route.LoaderArgs) {
	const analytics = await getTeamLeaderAnalytics(request);
	return { analytics };
}

export default function TeamAnalytics({ loaderData }: Route.ComponentProps) {
	const { analytics } = loaderData;

	return (
		<div className="flex flex-col gap-6 p-6">
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
					<p className="text-2xl font-bold">{analytics.teamOverview.totalAgents}</p>
				</div>

				<div className="bg-white rounded-lg border p-6">
					<h3 className="text-sm font-medium text-muted-foreground">
						Active Agents
					</h3>
					<p className="text-2xl font-bold">{analytics.teamOverview.activeAgents}</p>
				</div>

				<div className="bg-white rounded-lg border p-6">
					<h3 className="text-sm font-medium text-muted-foreground">
						Total Courses
					</h3>
					<p className="text-2xl font-bold">{analytics.teamOverview.totalCourses}</p>
				</div>

				<div className="bg-white rounded-lg border p-6">
					<h3 className="text-sm font-medium text-muted-foreground">
						Average Progress
					</h3>
					<p className="text-2xl font-bold">{analytics.teamOverview.averageProgress}%</p>
				</div>
			</div>

			<div className="bg-white rounded-lg border p-6">
				<h3 className="text-lg font-semibold mb-4">Agent Performance</h3>
				{analytics.agentAnalytics.success && analytics.agentAnalytics.agents.length > 0 ? (
					<div className="overflow-x-auto">
						<table className="w-full border-collapse">
							<thead>
								<tr className="border-b">
									<th className="text-left p-2">Agent Name</th>
									<th className="text-left p-2">Email</th>
									<th className="text-left p-2">Status</th>
									<th className="text-left p-2">Courses</th>
									<th className="text-left p-2">Progress</th>
									<th className="text-left p-2">Quiz Score</th>
								</tr>
							</thead>
							<tbody>
								{analytics.agentAnalytics.agents.map((agent) => (
									<tr key={agent.id} className="border-b">
										<td className="p-2 font-medium">{agent.name}</td>
										<td className="p-2 text-sm text-muted-foreground">{agent.email}</td>
										<td className="p-2">
											<span className={`inline-block px-2 py-1 text-xs rounded-full ${
												agent.isActivated 
													? 'bg-green-100 text-green-800' 
													: 'bg-red-100 text-red-800'
											}`}>
												{agent.isActivated ? 'Active' : 'Inactive'}
											</span>
										</td>
										<td className="p-2">{agent.summary.totalEnrolledCourses}</td>
										<td className="p-2">{agent.summary.averageProgress}%</td>
										<td className="p-2">{agent.summary.overallAverageQuizScore}%</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<p className="text-muted-foreground">
						No agents found or unable to load agent analytics.
					</p>
				)}
			</div>
		</div>
	);
}
