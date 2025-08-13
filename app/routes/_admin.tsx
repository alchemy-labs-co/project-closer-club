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
import { isAuthenticated } from "~/lib/auth/auth.server";
import type { Route } from "./+types/_admin";

export async function loader({ request }: Route.LoaderArgs) {
	const { session } = await isAuthenticated(request);

	if (!session || session.role !== "admin") {
		return redirect("/login");
	}

	return {
		admin: session,
	};
}

export function useDashboardLayoutLoaderData() {
	const data = useRouteLoaderData<typeof loader>("routes/_admin");
	if (!data) {
		throw new Error(
			"Dashboard Loader needs to be used within a DashboardLoader context, the route needs to be a child of the Dashboard route",
		);
	}
	return data;
}

function DashboardContent({ isLoading }: { isLoading: boolean }) {
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
					<div className="overflow-y-auto h-full">
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
	const { admin } = loaderData;
	return (
		<SidebarProvider
			style={
				{
					"--sidebar-width": "12rem",
				} as React.CSSProperties
			}
			className="h-dvh"
		>
			<AppSidebar variant="inset" collapsible="icon" name={admin.name} email={admin.email} />
			<DashboardContent isLoading={isLoading} />
		</SidebarProvider>
	);
}
