import {
	Outlet,
	redirect,
	useNavigation,
	useRouteLoaderData,
} from "react-router";
import { DashboardSkeleton } from "~/components/features/loading/dashboard-skeleton";
import { AppSidebar } from "~/components/global/admin/app-sidebar";
import { Breadcrumbs } from "~/components/global/admin/breadcrumbs";
import { Separator } from "~/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
	useSidebar,
} from "~/components/ui/sidebar";
import { teamLeaderDashboardConfig } from "~/config/dashboard";
import { isAuthenticated } from "~/lib/auth/auth.server";
import type { Route } from "./+types/_team";

export async function loader({ request }: Route.LoaderArgs) {
	const { session } = await isAuthenticated(request);

	if (!session || session.role !== "team_leader") {
		return redirect("/login");
	}

	return {
		teamLeader: session,
	};
}

export function useTeamLeaderLayoutLoaderData() {
	const data = useRouteLoaderData<typeof loader>("routes/_team");
	if (!data) {
		throw new Error(
			"Team Leader Loader needs to be used within a TeamLeaderLoader context, the route needs to be a child of the Team Leader route",
		);
	}
	return data;
}

function TeamDashboardContent({ isLoading }: { isLoading: boolean }) {
	const { state } = useSidebar();
	const isCollapsed = state === "collapsed";
	
	return (
		<SidebarInset className="overflow-hidden">
			<div className="flex flex-1 flex-col p-4 h-full">
				{/* BreadCrumbs Component */}
				<div className="flex items-center gap-2 pb-4 border-b">
					<SidebarTrigger className="-ml-1" />
					{!isCollapsed && (
						<Separator orientation="vertical" className="mr-2 h-2 transition-all" />
					)}
					<Breadcrumbs />
				</div>

				{isLoading ? (
					<DashboardSkeleton />
				) : (
					<div className="overflow-hidden min-h-[calc(100dvh-76.8px)]">
						<Outlet />
					</div>
				)}
			</div>
		</SidebarInset>
	);
}

export default function Page({ loaderData }: Route.ComponentProps) {
	const navigation = useNavigation();
	const isLoading = navigation.state === "loading";
	const { teamLeader } = loaderData;
	return (
		<SidebarProvider
			style={
				{
					"--sidebar-width": "12rem",
				} as React.CSSProperties
			}
			className="h-dvh"
		>
			<AppSidebar
				variant="inset"
				collapsible="icon"
				config={teamLeaderDashboardConfig}
				name={teamLeader.name}
				email={teamLeader.email}
			/>
			<TeamDashboardContent isLoading={isLoading} />
		</SidebarProvider>
	);
}
