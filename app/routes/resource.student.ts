import { data, redirect, type ActionFunctionArgs } from "react-router";
import {
	handleActivateStudent,
	handleCreateStudent,
	handleDeactivateStudent,
	handleDeleteStudent,
	handleUpdateStudent,
	handleUpdateStudentPassword,
} from "~/lib/admin/actions/student/student.server";
import { handlePromoteAgentToTeamLeader } from "~/lib/admin/actions/student/promote-to-team-leader.server";
import type { Route } from "./+types/resource.student";
import { toast } from "sonner";

const intents = [
	"create-student",
	"delete-student",
	"activate-student",
	"deactivate-student",
	"update-student",
	"update-student-password",
	"promote-to-team-leader",
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
			"create-student": handleCreateStudent,
			"delete-student": handleDeleteStudent,
			"activate-student": handleActivateStudent,
			"deactivate-student": handleDeactivateStudent,
			"update-student": handleUpdateStudent,
			"update-student-password": handleUpdateStudentPassword,
			"promote-to-team-leader": handlePromoteAgentToTeamLeader,
		} as const;

		const handler = handlers[intent as keyof typeof handlers];
		return handler(request, formData);
	} catch (error) {
		console.error("🔴Action error:", error);
		return data(
			{ success: false, message: "An unexpected error occurred" },
			{ status: 500 },
		);
	}
}
