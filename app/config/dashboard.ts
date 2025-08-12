import {
	BarChart3,
	Book,
	Home,
	ListChecks,
	Magnet,
	Pipette,
	Users,
	Users2,
	Video,
	type LucideProps,
} from "lucide-react";
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
			src: "/logos/closer-club-logo.png",
			alt: "Closer Club Logo",
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
				title: "Videos",
				icon: Video,
				url: "/dashboard/videos",
			},
			{
				title: "Quizzes",
				icon: ListChecks,
				url: "/dashboard/quizzes",
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
				title: "Leads",
				icon: Magnet,
				url: "/dashboard/leads",
			},
		],
	},
	videoPlayer: "Bunny",
	libraryId: "461493",
};

export const teamLeaderDashboardConfig: DahsboardConfig = {
	sidebar: {
		logo: {
			src: "/logos/closer-club-logo.png",
			alt: "Closer Club Logo",
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
