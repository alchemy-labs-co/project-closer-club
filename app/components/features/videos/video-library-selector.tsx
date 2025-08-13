import {
	Calendar,
	Check,
	CheckCircle,
	Clock,
	Film,
	Loader2,
	Play,
	Search,
	XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFetcher } from "react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { cn, formatDuration, getVideoThumbnailUrl } from "~/lib/utils";

// Video type based on the schema
type Video = {
	id: string;
	title: string;
	description?: string | null;
	videoGuid: string;
	thumbnailUrl?: string | null;
	duration?: number | null;
	tags?: string | null;
	uploadedBy?: string | null;
	libraryId: string;
	fileSize?: number | null;
	resolution?: string | null;
	status: string;
	createdAt: Date | string;
	updatedAt: Date | string;
};

type VideosResponse = {
	success: boolean;
	videos: Video[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
};

interface VideoLibrarySelectorProps {
	onSelectVideo: (video: Video) => void;
	selectedVideoId?: string;
}

export function VideoLibrarySelector({
	onSelectVideo,
	selectedVideoId,
}: VideoLibrarySelectorProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const fetcher = useFetcher<VideosResponse>();

	// Debounce search query
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedQuery(searchQuery);
			setCurrentPage(1); // Reset to first page on search
		}, 300);

		return () => clearTimeout(timer);
	}, [searchQuery]);

	// Fetch videos when debounced query or page changes
	useEffect(() => {
		const searchParams = new URLSearchParams();
		searchParams.set("status", "ready"); // Only show ready videos
		searchParams.set("page", currentPage.toString());
		searchParams.set("limit", "20");

		if (debouncedQuery) {
			searchParams.set("query", debouncedQuery);
		}

		// Use the resource route for fetching videos
		fetcher.load(`/resource/videos?${searchParams.toString()}`);
	}, [debouncedQuery, currentPage]); // Remove fetcher from dependencies to prevent infinite loop

	const videos = fetcher.data?.videos || [];
	const pagination = fetcher.data?.pagination;
	const isLoading = fetcher.state === "loading";

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "ready":
				return (
					<Badge className="bg-green-500/10 text-green-500 border-green-500/20">
						<CheckCircle className="w-3 h-3 mr-1" />
						Ready
					</Badge>
				);
			case "processing":
				return (
					<Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
						<Loader2 className="w-3 h-3 mr-1 animate-spin" />
						Processing
					</Badge>
				);
			case "failed":
				return (
					<Badge className="bg-red-500/10 text-red-500 border-red-500/20">
						<XCircle className="w-3 h-3 mr-1" />
						Failed
					</Badge>
				);
			default:
				return null;
		}
	};

	const getThumbnailUrl = (video: Video) => {
		if (video.thumbnailUrl) {
			return video.thumbnailUrl;
		}
		// Generate Bunny CDN thumbnail URL using the utility
		return getVideoThumbnailUrl(video.libraryId, video.videoGuid);
	};

	const handleVideoSelect = (video: Video) => {
		onSelectVideo(video);
	};

	const handlePageChange = useCallback((page: number) => {
		setCurrentPage(page);
	}, []);

	// Memoized pagination buttons to avoid unnecessary re-renders
	const paginationButtons = useMemo(() => {
		if (!pagination || pagination.totalPages <= 1) return null;

		return Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
			.filter(
				(page) =>
					page === 1 ||
					page === pagination.totalPages ||
					Math.abs(page - pagination.page) <= 1,
			)
			.map((page, index, array) => (
				<div key={page} className="flex items-center">
					{index > 0 && array[index - 1] !== page - 1 && (
						<span className="px-2 text-muted-foreground">...</span>
					)}
					<Button
						variant={page === pagination.page ? "default" : "outline"}
						size="sm"
						onClick={() => handlePageChange(page)}
						disabled={isLoading}
					>
						{page}
					</Button>
				</div>
			));
	}, [pagination, isLoading, handlePageChange]);

	return (
		<div className="flex flex-col gap-6">
			{/* Search Bar */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder="Search videos by title, description, or tags..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="pl-10"
					disabled={false} // Never disable the search input
				/>
				{isLoading && (
					<Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
				)}
			</div>

			{/* Videos Grid */}
			{isLoading && videos.length === 0 ? (
				<div className="flex items-center justify-center py-12">
					<div className="flex flex-col items-center gap-3">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						<p className="text-sm text-muted-foreground">Loading videos...</p>
					</div>
				</div>
			) : videos.length === 0 ? (
				<Card className="p-12 text-center border-2 border-dashed">
					<div className="flex flex-col items-center">
						<div className="rounded-full bg-muted p-3 mb-4">
							<Film className="h-8 w-8 text-muted-foreground" />
						</div>
						<h3 className="text-lg font-semibold mb-2">
							{debouncedQuery ? "No videos found" : "No videos available"}
						</h3>
						<p className="text-muted-foreground max-w-sm">
							{debouncedQuery
								? "Try adjusting your search query to find videos."
								: "No ready videos are available in your library yet."}
						</p>
					</div>
				</Card>
			) : (
				<div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
					{videos.map((video) => (
						<Card
							key={video.id}
							className={cn(
								"cursor-pointer transition-all hover:shadow-md",
								selectedVideoId === video.id &&
									"ring-2 ring-primary border-primary shadow-md bg-primary/5",
							)}
							onClick={() => handleVideoSelect(video)}
						>
							<div className="flex gap-3 p-3">
								{/* Thumbnail */}
								<div className="relative w-32 h-20 flex-shrink-0 bg-muted rounded overflow-hidden">
									<img
										src={getThumbnailUrl(video)}
										alt={video.title}
										className="w-full h-full object-cover"
										loading="lazy"
										onError={(e) => {
											// Fallback to Play icon if thumbnail fails to load
											const target = e.target as HTMLImageElement;
											target.style.display = "none";
											const parent = target.parentElement;
											if (parent && !parent.querySelector(".fallback-icon")) {
												const fallback = document.createElement("div");
												fallback.className =
													"fallback-icon w-full h-full flex items-center justify-center bg-muted";
												fallback.innerHTML = `<svg class="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
												parent.appendChild(fallback);
											}
										}}
									/>

									{/* Duration badge */}
									{video.duration && (
										<div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
											<Clock className="w-3 h-3" />
											{formatDuration(video.duration)}
										</div>
									)}

									{/* Selection indicator */}
									{selectedVideoId === video.id && (
										<div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
											<Check className="w-3 h-3" />
										</div>
									)}

									{/* Processing overlay */}
									{video.status === "processing" && (
										<div className="absolute inset-0 bg-black/50 flex items-center justify-center">
											<Loader2 className="h-6 w-6 text-white animate-spin" />
										</div>
									)}
								</div>

								{/* Video Info */}
								<div className="flex-1 min-w-0">
									<h4 className="font-semibold text-sm line-clamp-1 mb-1">
										{video.title}
									</h4>
									{video.description && (
										<p className="text-xs text-muted-foreground line-clamp-2 mb-2">
											{video.description}
										</p>
									)}

									<div className="flex items-center gap-3 text-xs">
										{/* Upload date */}
										<div className="flex items-center gap-1 text-muted-foreground">
											<Calendar className="w-3 h-3" />
											{new Date(video.createdAt).toLocaleDateString()}
										</div>

										{/* Status badge */}
										{getStatusBadge(video.status)}

										{/* Tags */}
										{video.tags && (
											<div className="flex gap-1">
												{video.tags
													.split(",")
													.slice(0, 2)
													.map((tag) => (
														<Badge
															key={tag.trim()}
															variant="secondary"
															className="text-xs px-1.5 py-0"
														>
															{tag.trim()}
														</Badge>
													))}
											</div>
										)}
									</div>
								</div>
							</div>
						</Card>
					))}
				</div>
			)}

			{/* Pagination */}
			{pagination && pagination.totalPages > 1 && (
				<div className="flex justify-center items-center gap-2 mt-6">
					<Button
						variant="outline"
						size="sm"
						onClick={() => handlePageChange(pagination.page - 1)}
						disabled={pagination.page === 1 || isLoading}
					>
						Previous
					</Button>

					<div className="flex items-center gap-1">{paginationButtons}</div>

					<Button
						variant="outline"
						size="sm"
						onClick={() => handlePageChange(pagination.page + 1)}
						disabled={pagination.page === pagination.totalPages || isLoading}
					>
						Next
					</Button>
				</div>
			)}
		</div>
	);
}
