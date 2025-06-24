import type { Route } from "./+types/_team.team.courses";

export async function loader({ request }: Route.LoaderArgs) {
	// TODO: Add logic to fetch courses assigned to team leader's agents
	return {
		courses: [],
	};
}

export default function TeamCourses() {
	return (
		<div className="flex flex-col gap-6 p-6">
			<div className="flex flex-col gap-2">
				<h1 className="text-2xl font-bold">Team Courses</h1>
				<p className="text-muted-foreground">
					Monitor courses assigned to your agents
				</p>
			</div>

			<div className="bg-white rounded-lg border">
				<div className="p-6 border-b">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-semibold">Assigned Courses</h3>
						<div className="text-sm text-muted-foreground">
							Total: 0 courses
						</div>
					</div>
				</div>

				<div className="p-6">
					<div className="text-center py-12">
						<p className="text-muted-foreground">
							No courses assigned to your team yet.
						</p>
						<p className="text-sm text-muted-foreground mt-2">
							Courses will appear here once assigned to your agents.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
