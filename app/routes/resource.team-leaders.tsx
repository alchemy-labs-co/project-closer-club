import { data, redirect } from "react-router";
import type { Route } from "./+types/resource.team-leaders";
import { toast } from "sonner";
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

export async function clientAction({ serverAction }: Route.ClientActionArgs) {
    const result:
        | {
            success: boolean;
            message: string;
            redirectToUrl?: string;
        }
        | undefined = await serverAction();

    if (result?.success) {
        toast.success(result?.message);
        if (result?.redirectToUrl) {
            throw redirect(result?.redirectToUrl);
        }
    } else {
        toast.error(result?.message);
    }
    return result;
}

export async function action({ request }: Route.ActionArgs) {
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
		return data({ success: false, message: "An unexpected error occurred" }, { status: 500 });
	}
}
