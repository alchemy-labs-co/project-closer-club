import { data, redirect, type ActionFunctionArgs } from "react-router";
import {
	handleSignInAdmin,
	handleSignInStudent,
	handleSignInTeamLeader,
	handleUnifiedSignIn,
} from "~/lib/admin/actions/auth/auth.server";
import { handleSignOut } from "~/lib/auth/auth.server";
import type { Route } from "./+types/resource.auth";
import { toast } from "sonner";
// import { handleSignInAdmin, handleSignInStudent, handleSignOut } from "~/lib/admin/actions/auth/auth.server"

const intents = [
	"unified-sign-in",
	"sign-in-admin",
	"sign-in-student",
	"sign-in-team-leader",
	"sign-out-admin",
	"sign-out-student",
	"sign-out-team-leader",
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
			"unified-sign-in": handleUnifiedSignIn,
			"sign-in-admin": handleSignInAdmin,
			"sign-in-student": handleSignInStudent,
			"sign-in-team-leader": handleSignInTeamLeader,
			"sign-out-admin": handleSignOut,
			"sign-out-student": handleSignOut,
			"sign-out-team-leader": handleSignOut,
		} as const;

		const handler = handlers[intent as keyof typeof handlers];
		return handler(request, formData);
	} catch (error) {
		console.error("Action error:", error);
		return data(
			{ success: false, message: "An unexpected error occurred" },
			{ status: 500 },
		);
	}
}
