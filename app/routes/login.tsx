import { redirect } from "react-router";
import SharedAuthPage from "~/components/global/admin/shared-auth-page";
import { isAgentLoggedIn } from "~/lib/auth/auth.server";
import type { Route } from "./+types/login";

export async function loader({ request }: Route.LoaderArgs) {
	const { isLoggedIn } = await isAgentLoggedIn(request);
	if (isLoggedIn) {
		throw redirect("/student/courses");
	}
	return null;
}
export default function AuthenticationPage() {
	return <SharedAuthPage type="student" />;
}
