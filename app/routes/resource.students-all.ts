import { data } from "react-router";
import { isAdminLoggedIn } from "~/lib/auth/auth.server";
import type { Route } from "./+types/resource.students-all";
import db from "~/db/index.server";
import { agentsTable, teamLeadersTable } from "~/db/schema";
import { desc, eq } from "drizzle-orm";

export async function loader({ request }: Route.LoaderArgs) {
	const { isLoggedIn } = await isAdminLoggedIn(request);
	if (!isLoggedIn) {
		return data("Not Allowed", { status: 405 });
	}
	try {
		const [agentsWithTeamLeader, teamLeaders] = await Promise.all([
			db
				.select({
					id: agentsTable.id,
					studentId: agentsTable.studentId,
					name: agentsTable.name,
					email: agentsTable.email,
					phone: agentsTable.phone,
					isActivated: agentsTable.isActivated,
					teamLeaderId: agentsTable.teamLeaderId,
					createdAt: agentsTable.createdAt,
					updatedAt: agentsTable.updatedAt,
					assignedTeamLeaderName: teamLeadersTable.name,
				})
				.from(agentsTable)
				.leftJoin(
					teamLeadersTable,
					eq(agentsTable.teamLeaderId, teamLeadersTable.id),
				)
				.orderBy(desc(agentsTable.createdAt)),
			db
				.select()
				.from(teamLeadersTable)
				.orderBy(desc(teamLeadersTable.createdAt)),
		]);

		// Add role field to distinguish between agents and team leaders
		const agentsWithRole = agentsWithTeamLeader.map((agent) => ({
			...agent,
			role: "agent" as const,
		}));

		const teamLeadersWithRole = teamLeaders.map((teamLeader) => ({
			...teamLeader,
			// Map teamLeaderId to studentId for consistency
			studentId: teamLeader.teamLeaderId,
			role: "team leader" as const,
			assignedTeamLeaderName: null, // Team leaders don't have assigned team leaders
		}));

		return data(
			{ students: [...agentsWithRole, ...teamLeadersWithRole] },
			{ status: 200 },
		);
	} catch (error) {
		console.error("🔴Error fetching all the students", error);
		return data(
			error instanceof Error ? error.message : "Something went wrong",
			{ status: 500 },
		);
	}
}
