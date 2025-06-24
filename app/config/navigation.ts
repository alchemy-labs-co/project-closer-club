import { BookOpen, type LucideIcon } from "lucide-react";

export interface NavItem {
	label: string;
	href: string;
	icon?: LucideIcon;
	description?: string;
}

export const studentNavItems: NavItem[] = [
	{
		label: "Courses",
		href: "/student/courses",
		icon: BookOpen,
	},
];
