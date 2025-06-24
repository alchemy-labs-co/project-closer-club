import { redirect } from "react-router";
import SharedAuthPage from "~/components/global/admin/shared-auth-page";
import type { Route } from "./+types/team-leader.login";
import { isTeamLeaderLoggedIn } from "~/lib/auth/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
	const { isLoggedIn } = await isTeamLeaderLoggedIn(request);
	if (isLoggedIn) {
		throw redirect("/team/analytics");
	}
	return null;
}

export default function AuthenticationPage() {
	return <SharedAuthPage type="team-leader" />;
}
