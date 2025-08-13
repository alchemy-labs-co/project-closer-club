import { type LucideIcon } from "lucide-react";
import * as React from "react";
import { Link, useLocation } from "react-router";
import { dashboardConfig } from "~/config/dashboard";
import { Collapsible } from "../../ui/collapsible";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "../../ui/sidebar";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "../../ui/tooltip";
import { NavUser } from "./nav-user";
import { PrimaryLogo } from "../brand/primary-logo";
import { cn } from "~/lib/utils";

type DashboardConfig = {
	sidebar: {
		logo: {
			src: string;
			alt: string;
		};
		items: {
			title: string;
			icon: React.ForwardRefExoticComponent<
				Omit<any, "ref"> & React.RefAttributes<SVGSVGElement>
			>;
			url: string;
		}[];
	};
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
	config?: DashboardConfig;
	name: string;
	email: string;
}

export function AppSidebar({
	config = dashboardConfig,
	name,
	email,
	...props
}: AppSidebarProps) {
	const { state, toggleSidebar } = useSidebar();
	const isCollapsed = state === "collapsed";

	return (
		<Sidebar {...props}>
			<SidebarHeader className="p-4">
				<div className="flex flex-row items-center gap-2">
					{isCollapsed ? (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										onClick={toggleSidebar}
										className="flex items-center justify-center w-full"
									>
										<PrimaryLogo asButton />
									</button>
								</TooltipTrigger>
								<TooltipContent side="right" sideOffset={10}>
									<p>Open sidebar</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					) : (
						<PrimaryLogo />
					)}
					<span
						className={cn(
							"text-xl font-semibold whitespace-nowrap transition-opacity duration-200 ease-in-out",
							isCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
						)}
					>
						Closer Club
					</span>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={config.sidebar.items} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser name={name} email={email} />
			</SidebarFooter>
		</Sidebar>
	);
}

export function NavMain({
	items,
}: {
	items: {
		title: string;
		url: string;
		icon: LucideIcon;
		isActive?: boolean;
		items?: {
			title: string;
			url: string;
		}[];
		disabled?: boolean;
	}[];
}) {
	const { pathname } = useLocation();
	const { setOpenMobile } = useSidebar();
	return (
		<SidebarGroup>
			<SidebarMenu>
				{items.map((item) => {
					const isActive = pathname === item.url;

					return (
						<Collapsible key={item.title} asChild defaultOpen={item.isActive}>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									tooltip={item.title}
									disabled={item.disabled}
									className="hover:bg-brand-primary/60 hover:text-white"
									onClick={() => {
										setOpenMobile(false);
									}}
								>
									<Link
										to={item.disabled ? "#" : item.url}
										data-disabled={item.disabled}
										className={cn(
											"data-[disabled=true]:opacity-50 transition-colors group/link",
											isActive && `bg-brand-primary text-white`,
										)}
									>
										<item.icon
											className={cn(
												"text-muted-foreground transition-colors",
												"group-hover/link:text-white",
												isActive && `text-white`,
											)}
										/>
										<span className="transition-all duration-200">{item.title}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</Collapsible>
					);
				})}
			</SidebarMenu>
		</SidebarGroup>
	);
}
