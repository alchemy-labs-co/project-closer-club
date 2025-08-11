import { redirect } from "react-router";
import type { Route } from "./+types/admin.login";

export async function loader({ request }: Route.LoaderArgs) {
	// Redirect to unified login
	throw redirect("/login");
}

export default function AuthenticationPage() {
	// This page should not be rendered as we redirect in the loader
	return null;
}
