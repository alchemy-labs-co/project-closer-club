import type { Route } from "./+types/_team.team.analytics";

export async function loader({ request }: Route.LoaderArgs) {
	// TODO: Add team leader analytics data logic
	return {
		analytics: {
			totalAgents: 0,
			activeCourses: 0,
			completedCourses: 0,
			averageProgress: 0,
		},
	};
}

export default function TeamAnalytics() {
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
					<p className="text-2xl font-bold">0</p>
				</div>

				<div className="bg-white rounded-lg border p-6">
					<h3 className="text-sm font-medium text-muted-foreground">
						Active Courses
					</h3>
					<p className="text-2xl font-bold">0</p>
				</div>

				<div className="bg-white rounded-lg border p-6">
					<h3 className="text-sm font-medium text-muted-foreground">
						Completed Courses
					</h3>
					<p className="text-2xl font-bold">0</p>
				</div>

				<div className="bg-white rounded-lg border p-6">
					<h3 className="text-sm font-medium text-muted-foreground">
						Average Progress
					</h3>
					<p className="text-2xl font-bold">0%</p>
				</div>
			</div>

			<div className="bg-white rounded-lg border p-6">
				<h3 className="text-lg font-semibold mb-4">Team Performance</h3>
				<p className="text-muted-foreground">
					Detailed analytics and charts will be implemented here.
				</p>
			</div>
		</div>
	);
}
