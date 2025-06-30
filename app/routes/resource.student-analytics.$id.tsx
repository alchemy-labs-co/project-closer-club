import { isAdminLoggedIn } from "~/lib/auth/auth.server";
import type { Route } from "./+types/resource.student-analytics.$id";
import { redirect } from "react-router";
import { getAgentAnalytics } from "~/lib/admin/data-access/analytics/agent-analytics.server";

export async function loader({ params, request }: Route.LoaderArgs) {
    const { isLoggedIn } = await isAdminLoggedIn(request);
    if (!isLoggedIn) {
        throw redirect("/admin/login");
    }
    const { courseCompletionAnalytics } = await getAgentAnalytics(request, params.id)
    return { courseCompletionAnalytics }
}