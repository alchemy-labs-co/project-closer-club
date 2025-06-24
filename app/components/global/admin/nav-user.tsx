import { EllipsisVertical, LogOut, UserCircle } from "lucide-react";

import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "~/components/ui/sidebar";
import { LogoutProvider } from "./logout";

interface NavUserProps {
	name: string;
	email: string;
}

export function NavUser({ name, email }: NavUserProps) {
	const { isMobile } = useSidebar();
	const displayName =
		name.charAt(0).toUpperCase() + name.charAt(1).toUpperCase();
	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
						>
							<Avatar className="h-8 w-8 rounded-lg grayscale">
								{/* <AvatarImage src alt={name} /> */}
								<AvatarFallback className="rounded-lg">
									{displayName}
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">{name}</span>
								<span className="text-muted-foreground truncate text-xs">
									{email}
								</span>
							</div>
							<EllipsisVertical className="ml-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<Avatar className="h-8 w-8 rounded-lg">
									{/* <AvatarImage src={avatar} alt={name} /> */}
									<AvatarFallback className="rounded-lg">
										{displayName}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">{name}</span>
									<span className="text-muted-foreground truncate text-xs">
										{email}
									</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<LogoutProvider type="admin">
							<DropdownMenuItem className="w-full">
								<LogOut />
								Log out
							</DropdownMenuItem>
						</LogoutProvider>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
