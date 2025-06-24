import { redirect } from "react-router";
import SharedAuthPage from "~/components/global/admin/shared-auth-page";
import type { Route } from "./+types/admin.login";
import { isAdminLoggedIn } from "~/lib/auth/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
	const { isLoggedIn } = await isAdminLoggedIn(request);
	if (isLoggedIn) {
		throw redirect("/dashboard");
	}
	return null;
}

export default function AuthenticationPage() {
	return <SharedAuthPage type="admin" />;
}
