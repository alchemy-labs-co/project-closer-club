import { redirect } from "react-router";
import UnifiedAuthPage from "~/components/global/unified-auth-page";
import { isAuthenticated } from "~/lib/auth/auth.server";
import type { Route } from "./+types/login";

export async function loader({ request }: Route.LoaderArgs) {
	const { session } = await isAuthenticated(request);

	if (session) {
		// Already logged in - redirect based on role
		switch (session.role) {
			case "admin":
				throw redirect("/dashboard");
			case "team_leader":
				throw redirect("/team/analytics");
			case "user":
				throw redirect("/student/courses");
			default:
				throw redirect("/");
		}
	}

	return null;
}

export default function UnifiedLoginPage() {
	return <UnifiedAuthPage />;
}
