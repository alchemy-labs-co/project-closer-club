import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
	Clock,
	Eye,
	LayoutGrid,
	LayoutList,
	MoreVertical,
	Play,
	Search,
	AlertCircle,
	CheckCircle,
	Loader2,
	XCircle,
	Video,
	Upload,
	Trash2,
} from "lucide-react";
import { VideoUploadSection } from "./video-upload-section";
import { useVideosLoaderData } from "~/routes/_admin.dashboard.videos";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import { VideoPlayer } from "~/components/ui/video-thumbnail-player";
import {
	cn,
	formatDuration,
	formatBytes,
	getVideoThumbnailUrl,
	getVideoEmbedUrl,
} from "~/lib/utils";
import { VideoCard } from "./video-card";
import { DeleteVideoDialog } from "./delete-video-dialog";

export function VideosList() {
	const { videos, pagination, stats, filters } = useVideosLoaderData();
	const [searchParams, setSearchParams] = useSearchParams();
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [searchQuery, setSearchQuery] = useState(filters?.query || "");
	const [videoToDelete, setVideoToDelete] = useState<{
		id: string;
		title: string;
	} | null>(null);
	const [optimisticDeletedIds, setOptimisticDeletedIds] = useState<Set<string>>(
		new Set(),
	);
	const [isUploadMode, setIsUploadMode] = useState(false);
	const navigate = useNavigate();

	// Filter out optimistically deleted videos
	const visibleVideos = videos.filter((v) => !optimisticDeletedIds.has(v.id));

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		const params = new URLSearchParams(searchParams);
		if (searchQuery) {
			params.set("query", searchQuery);
		} else {
			params.delete("query");
		}
		params.set("page", "1");
		setSearchParams(params);
	};

	const handleStatusFilter = (status: string) => {
		const params = new URLSearchParams(searchParams);
		if (status !== "all") {
			params.set("status", status);
		} else {
			params.delete("status");
		}
		params.set("page", "1");
		setSearchParams(params);
	};

	const handlePageChange = (page: number) => {
		const params = new URLSearchParams(searchParams);
		params.set("page", page.toString());
		setSearchParams(params);
	};

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

	return (
		<div className="flex flex-col gap-6">
			{/* Stats Cards */}
			{stats && (
				<div className="grid gap-4 md:grid-cols-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Total Videos
							</CardTitle>
							<Play className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stats.total}</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Ready</CardTitle>
							<CheckCircle className="h-4 w-4 text-green-500" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stats.ready}</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Processing</CardTitle>
							<Loader2 className="h-4 w-4 text-blue-500" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stats.processing}</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Total Duration
							</CardTitle>
							<Clock className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{formatDuration(stats.totalDuration)}
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Filters and Search */}
			<div className="flex flex-col gap-4">
				<div className="flex flex-col sm:flex-row gap-4 items-center">
					<form onSubmit={handleSearch} className="flex-1 flex gap-2">
						<div className="relative flex-1">
							<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search videos..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-8"
							/>
						</div>
						<Button type="submit">Search</Button>
					</form>

					<Select
						value={filters?.status || "all"}
						onValueChange={handleStatusFilter}
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Filter by status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Videos</SelectItem>
							<SelectItem value="ready">Ready</SelectItem>
							<SelectItem value="processing">Processing</SelectItem>
							<SelectItem value="failed">Failed</SelectItem>
						</SelectContent>
					</Select>

					<div className="flex gap-2">
						<Button
							onClick={() => setIsUploadMode(!isUploadMode)}
							variant={isUploadMode ? "secondary" : "default"}
						>
							<Upload className="h-4 w-4 mr-2" />
							{isUploadMode ? "Cancel Upload" : "Upload Videos"}
						</Button>
						<Button
							variant={viewMode === "grid" ? "default" : "outline"}
							size="icon"
							onClick={() => setViewMode("grid")}
						>
							<LayoutGrid className="h-4 w-4" />
						</Button>
						<Button
							variant={viewMode === "list" ? "default" : "outline"}
							size="icon"
							onClick={() => setViewMode("list")}
						>
							<LayoutList className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* Upload Section - Slides down when active */}
				{isUploadMode && (
					<div className="animate-slide-down">
						<VideoUploadSection
							onUploadComplete={() => {
								setIsUploadMode(false);
								window.location.reload();
							}}
							onCancel={() => setIsUploadMode(false)}
						/>
					</div>
				)}
			</div>

			{/* Videos Display */}
			{visibleVideos.length === 0 ? (
				<Card className="p-12 text-center border-2 border-dashed">
					<div className="flex flex-col items-center">
						<div className="rounded-full bg-muted p-3 mb-4">
							<Video className="h-8 w-8 text-muted-foreground" />
						</div>
						<h3 className="text-lg font-semibold mb-2">
							{videos.length === 0 &&
							!filters?.query &&
							filters?.status === "all"
								? "No Videos Uploaded"
								: "No videos found"}
						</h3>
						<p className="text-muted-foreground mb-6 max-w-sm">
							{filters?.query || filters?.status !== "all"
								? "Try adjusting your filters or search query"
								: "Upload your first video to build your library and share content across your courses."}
						</p>
					</div>
				</Card>
			) : viewMode === "grid" ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{visibleVideos.map((video) => (
						<VideoCard
							key={video.id}
							video={video}
							onDelete={() =>
								setVideoToDelete({ id: video.id, title: video.title })
							}
						/>
					))}
				</div>
			) : (
				<div className="space-y-4">
					{visibleVideos.map((video) => (
						<Card key={video.id}>
							<CardHeader>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-4">
										{/* Video player for ready videos, static thumbnail for others */}
										{video.status === "ready" &&
										video.videoGuid &&
										video.libraryId ? (
											<div className="w-32 h-20">
												<VideoPlayer
													thumbnailUrl={getVideoThumbnailUrl(
														video.libraryId,
														video.videoGuid,
													)}
													videoUrl={getVideoEmbedUrl(
														video.libraryId,
														video.videoGuid,
													)}
													title={video.title}
													description={video.description || undefined}
													aspectRatio="16/9"
													className="rounded overflow-hidden"
												/>
											</div>
										) : (
											<div className="relative w-32 h-20 bg-muted rounded overflow-hidden">
												{video.thumbnailUrl ? (
													<img
														src={video.thumbnailUrl}
														alt={video.title}
														className="w-full h-full object-cover"
														crossOrigin="anonymous"
													/>
												) : (
													<div className="w-full h-full flex items-center justify-center">
														<Play className="h-8 w-8 text-muted-foreground" />
													</div>
												)}
												{video.duration && (
													<div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
														{formatDuration(video.duration)}
													</div>
												)}
												{video.status === "processing" && (
													<div className="absolute inset-0 bg-black/50 flex items-center justify-center">
														<Loader2 className="h-6 w-6 text-white animate-spin" />
													</div>
												)}
											</div>
										)}
										<div className="flex-1 min-w-0">
											<CardTitle className="text-base line-clamp-1">
												{video.title}
											</CardTitle>
											{video.description && (
												<CardDescription className="mt-1 line-clamp-2">
													{video.description}
												</CardDescription>
											)}
											<div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
												<span>
													Uploaded{" "}
													{new Date(video.createdAt).toLocaleDateString()}
												</span>
												{video.fileSize && (
													<span>{formatBytes(video.fileSize)}</span>
												)}
												{video.duration && (
													<span>• {formatDuration(video.duration)}</span>
												)}
											</div>
										</div>
									</div>
									<div className="flex items-center gap-2">
										{getStatusBadge(video.status)}
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon">
													<MoreVertical className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													className="text-red-600"
													onClick={() =>
														setVideoToDelete({
															id: video.id,
															title: video.title,
														})
													}
												>
													<Trash2 className="h-4 w-4 mr-2" />
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</div>
							</CardHeader>
						</Card>
					))}
				</div>
			)}

			{/* Pagination */}
			{pagination && pagination.totalPages > 1 && (
				<div className="flex justify-center gap-2 mt-6">
					<Button
						variant="outline"
						onClick={() => handlePageChange(pagination.page - 1)}
						disabled={pagination.page === 1}
					>
						Previous
					</Button>
					<div className="flex items-center gap-2">
						{Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
							.filter(
								(page) =>
									page === 1 ||
									page === pagination.totalPages ||
									Math.abs(page - pagination.page) <= 1,
							)
							.map((page, index, array) => (
								<>
									{index > 0 && array[index - 1] !== page - 1 && (
										<span key={`dots-${page}`}>...</span>
									)}
									<Button
										key={page}
										variant={page === pagination.page ? "default" : "outline"}
										size="sm"
										onClick={() => handlePageChange(page)}
									>
										{page}
									</Button>
								</>
							))}
					</div>
					<Button
						variant="outline"
						onClick={() => handlePageChange(pagination.page + 1)}
						disabled={pagination.page === pagination.totalPages}
					>
						Next
					</Button>
				</div>
			)}

			{/* Delete Dialog */}
			<DeleteVideoDialog
				video={videoToDelete || { id: "", title: "" }}
				open={!!videoToDelete}
				onOpenChange={(open) => {
					if (!open) {
						setVideoToDelete(null);
					}
				}}
				onDeleteSuccess={() => {
					if (videoToDelete) {
						// Add optimistic deletion
						setOptimisticDeletedIds((prev) =>
							new Set(prev).add(videoToDelete.id),
						);
						setVideoToDelete(null);
					}
				}}
			/>
		</div>
	);
}
