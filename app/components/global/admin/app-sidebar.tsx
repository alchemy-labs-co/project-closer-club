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
	return (
		<Sidebar {...props}>
			<SidebarHeader className="p-4 text-xl flex flex-row items-center gap-2">
				<PrimaryLogo />
				{/* <span className="text-xl font-medium">Admin Panel</span> */}
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
									className="hover:bg-brand-primary hover:text-white"
									onClick={() => {
										setOpenMobile(false);
									}}
								>
									<Link
										to={item.disabled ? "#" : item.url}
										data-disabled={item.disabled}
										className={cn(
											"data-[disabled=true]:opacity-50 transition-colors",
											isActive && `bg-brand-primary text-white`,
										)}
									>
										<item.icon
											className={cn(
												"text-muted-foreground",
												isActive && `text-white`,
											)}
										/>
										<span>{item.title}</span>
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
