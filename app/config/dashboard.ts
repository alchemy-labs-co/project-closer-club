import { Book, Home, Users, Users2, type LucideProps, BarChart3, ListChecks } from "lucide-react";
import type { VideoPlayerTypes } from "~/lib/types";

type DahsboardConfig = {
	sidebar: {
		logo: {
			src: string;
			alt: string;
		};

		items: {
			title: string;
			icon: React.ForwardRefExoticComponent<
				Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
			>;
			url: string;
		}[];
	};
	videoPlayer: VideoPlayerTypes["type"];
	libraryId?: string;
};

export const dashboardConfig: DahsboardConfig = {
	sidebar: {
		logo: {
			src: "/assets/LOGO.png",
			alt: "Logo",
		},
		items: [
			{
				title: "Dashboard",
				icon: Home,
				url: "/dashboard",
			},

			{
				title: "Courses",
				icon: Book,
				url: "/dashboard/courses",
			},
			{
				title: "Agents",
				icon: Users,
				url: "/dashboard/agents",
			},
			{
				title: "Team Leaders",
				icon: Users2,
				url: "/dashboard/team-leaders",
			},
			{
				title: "Quizzes",
				icon: ListChecks,
				url: "/dashboard/quizzes",
			},
			// {
			//   title: "Admins",
			//   icon: Users,
			//   url: "/dashboard/admins",
			// },
			// {
			//   title: "Messages",
			//   icon: MessageCircle,
			//   url: "/dashboard/messages",
			// },
			// {
			//   title: "Settings",
			//   icon: Settings,
			//   url: "/dashboard/settings",
			// },
		],
	},
	videoPlayer: "Bunny",
	libraryId: "455348",
};

export const teamLeaderDashboardConfig: DahsboardConfig = {
	sidebar: {
		logo: {
			src: "/assets/LOGO.png",
			alt: "Logo",
		},
		items: [
			{
				title: "Analytics",
				icon: BarChart3,
				url: "/team/analytics",
			},
			{
				title: "Agents",
				icon: Users,
				url: "/team/agents",
			},
			{
				title: "Courses",
				icon: Book,
				url: "/team/courses",
			},
		],
	},
	videoPlayer: "Bunny",
	libraryId: "448615",
};
