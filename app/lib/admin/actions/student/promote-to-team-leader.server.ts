import { eq } from "drizzle-orm";
import { data, redirect } from "react-router";
import db from "~/db/index.server";
import { agentsTable, teamLeadersTable, user } from "~/db/schema";
import { isAdminLoggedIn } from "~/lib/auth/auth.server";
import { promoteAgentToTeamLeaderSchema } from "~/lib/zod-schemas/student";
import { DeleteAllExistingAuthSessions } from "../auth/auth.server";

export async function handlePromoteAgentToTeamLeader(
	request: Request,
	formData: FormData,
) {
	// Admin auth check
	const { isLoggedIn } = await isAdminLoggedIn(request);
	if (!isLoggedIn) {
		throw redirect("/admin/login");
	}

	const { studentId } = Object.fromEntries(formData);

	// Validate the data
	const unvalidatedFields = promoteAgentToTeamLeaderSchema.safeParse({
		studentId,
	});

	if (!unvalidatedFields.success) {
		return data(
			{ success: false, message: "Invalid form data" },
			{ status: 400 },
		);
	}

	const validatedFields = unvalidatedFields.data;

	try {
		// Get the agent to verify they exist and are active
		const [agent] = await db
			.select()
			.from(agentsTable)
			.where(eq(agentsTable.studentId, validatedFields.studentId))
			.limit(1);

		if (!agent) {
			return data(
				{ success: false, message: "Agent not found" },
				{ status: 404 },
			);
		}

		if (!agent.isActivated) {
			return data(
				{ success: false, message: "Agent must be activated before promotion" },
				{ status: 400 },
			);
		}

		// Check if email already exists in team leaders table
		const [existingTeamLeader] = await db
			.select()
			.from(teamLeadersTable)
			.where(eq(teamLeadersTable.email, agent.email))
			.limit(1);

		if (existingTeamLeader) {
			return data(
				{
					success: false,
					message: "Email already exists in team leaders table",
				},
				{ status: 400 },
			);
		}

		// Get the user record to verify it exists
		const [userRecord] = await db
			.select()
			.from(user)
			.where(eq(user.id, validatedFields.studentId))
			.limit(1);

		if (!userRecord) {
			return data(
				{ success: false, message: "User record not found" },
				{ status: 404 },
			);
		}

		// Perform the promotion in a transaction
		await db.transaction(async (tx) => {
			// 1. Update user role from "user" to "team_leader"
			await tx
				.update(user)
				.set({ role: "team_leader" })
				.where(eq(user.id, validatedFields.studentId));

			// 2. Create team leader entry
			await tx.insert(teamLeadersTable).values({
				teamLeaderId: validatedFields.studentId,
				name: agent.name,
				email: agent.email,
				phone: agent.phone,
				isActivated: true, // Keep activation status
			});

			// 3. Remove agent from any team leader assignment
			await tx
				.update(agentsTable)
				.set({ teamLeaderId: null })
				.where(eq(agentsTable.studentId, validatedFields.studentId));

			// 4. Delete all existing sessions to force re-login with new role
			await DeleteAllExistingAuthSessions(validatedFields.studentId);
		});

		return data(
			{
				success: true,
				message: "Agent successfully promoted to team leader",
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error(
			"🔴Error promoting agent to team leader:",
			error instanceof Error ? error.message : error,
		);
		return data(
			{
				success: false,
				message:
					error instanceof Error ? error.message : "Something went wrong",
			},
			{ status: 500 },
		);
	}
}
