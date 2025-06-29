import { data, type ActionFunctionArgs } from "react-router";
import {
	handleActivateTeamLeader,
	handleCreateTeamLeader,
	handleDeactivateTeamLeader,
	handleDeleteTeamLeader,
	handleUpdateTeamLeader,
	handleUpdateTeamLeaderPassword,
	handleUpdateAgentAssignment,
} from "~/lib/admin/actions/team-leader/team-leader.server";

const intents = [
	"create-team-leader",
	"delete-team-leader",
	"activate-team-leader",
	"deactivate-team-leader",
	"update-team-leader",
	"update-team-leader-password",
	"update-agent-assignment",
];

export async function loader() {
	return data("Not Allowed", { status: 405 });
}

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const intent = formData.get("intent") as string;

	if (!intent || !intents.includes(intent)) {
		return data(
			{ success: false, message: "Invalid form submission" },
			{ status: 400 },
		);
	}

	try {
		const handlers = {
			"create-team-leader": handleCreateTeamLeader,
			"delete-team-leader": handleDeleteTeamLeader,
			"activate-team-leader": handleActivateTeamLeader,
			"deactivate-team-leader": handleDeactivateTeamLeader,
			"update-team-leader": handleUpdateTeamLeader,
			"update-team-leader-password": handleUpdateTeamLeaderPassword,
			"update-agent-assignment": handleUpdateAgentAssignment,
		} as const;

		const handler = handlers[intent as keyof typeof handlers];
		return handler(request, formData);
	} catch (error) {
		console.error("🔴Action error:", error);
		return data({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
