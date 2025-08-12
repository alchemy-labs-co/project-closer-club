import { useRouteLoaderData } from "react-router";
import { VideosList } from "~/components/features/videos/videos-list";
import {
	getAllVideos,
	getVideoStats,
} from "~/lib/admin/data-access/videos.server";
import type { Route } from "./+types/_admin.dashboard.videos";

export async function loader({ request }: Route.LoaderArgs) {
	const url = new URL(request.url);
	const page = Number(url.searchParams.get("page")) || 1;
	const query = url.searchParams.get("query") || "";
	const status = url.searchParams.get("status") || "all";

	const [videosResult, statsResult] = await Promise.all([
		getAllVideos(request, {
			page,
			query,
			status: status as any,
			limit: 20,
		}),
		getVideoStats(request),
	]);

	if (!videosResult.success) {
		return {
			videos: [],
			pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
			stats: null,
		};
	}

	return {
		videos: videosResult.videos || [],
		pagination: videosResult.pagination,
		stats: statsResult.success ? statsResult.stats : null,
		filters: { query, status },
	};
}

export function useVideosLoaderData() {
	const data = useRouteLoaderData<typeof loader>(
		"routes/_admin.dashboard.videos",
	);
	if (!data) {
		throw new Error(
			"Videos Loader needs to be used within a VideosLoader context, the route needs to be a child of the Videos route",
		);
	}
	return data;
}

export default function VideosPage() {
	const { videos } = useVideosLoaderData();

	return (
		<div className="flex flex-col gap-8 md:gap-12 h-full overflow-y-auto py-4">
			<div className="flex flex-row justify-between items-center w-full">
				<h1 className="text-2xl font-bold">Video Library</h1>
			</div>
			<VideosList />
		</div>
	);
}
