import {
	CheckCircle,
	Clock,
	Loader2,
	MoreVertical,
	Play,
	Trash2,
	XCircle,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
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
import { VideoPlayer } from "~/components/ui/video-thumbnail-player";
import {
	formatBytes,
	formatDuration,
	getVideoEmbedUrl,
	getVideoThumbnailUrl,
} from "~/lib/utils";

interface VideoCardProps {
	video: {
		id: string;
		title: string;
		description?: string | null;
		thumbnailUrl?: string | null;
		duration?: number | null;
		status: string;
		createdAt: Date | string;
		fileSize?: number | null;
		tags?: string | null;
		videoGuid: string;
		libraryId: string;
	};
	onDelete?: () => void;
}

export function VideoCard({ video, onDelete }: VideoCardProps) {
	const getStatusIcon = () => {
		switch (video.status) {
			case "ready":
				return <CheckCircle className="w-4 h-4 text-green-500" />;
			case "processing":
				return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
			case "failed":
				return <XCircle className="w-4 h-4 text-red-500" />;
			default:
				return null;
		}
	};

	const getStatusText = () => {
		switch (video.status) {
			case "ready":
				return "Ready";
			case "processing":
				return "Processing";
			case "failed":
				return "Failed";
			default:
				return video.status;
		}
	};

	// For ready videos, use the VideoPlayer component
	if (video.status === "ready" && video.videoGuid && video.libraryId) {
		const thumbnailUrl = getVideoThumbnailUrl(video.libraryId, video.videoGuid);
		const videoUrl = getVideoEmbedUrl(video.libraryId, video.videoGuid);

		return (
			<Card className="overflow-hidden hover:shadow-lg transition-shadow">
				<VideoPlayer
					thumbnailUrl={thumbnailUrl}
					videoUrl={videoUrl}
					title={video.title}
					description={video.description || undefined}
					className="rounded-none"
				/>
				<CardContent className="pt-3 pb-2">
					{video.tags && (
						<div className="flex flex-wrap gap-1 mb-2">
							{video.tags
								.split(",")
								.slice(0, 3)
								.map((tag) => (
									<Badge
										key={tag.trim()}
										variant="secondary"
										className="text-xs"
									>
										{tag.trim()}
									</Badge>
								))}
						</div>
					)}
					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<span>{new Date(video.createdAt).toLocaleDateString()}</span>
						{video.fileSize && <span>{formatBytes(video.fileSize)}</span>}
					</div>
				</CardContent>
				<CardFooter className="pt-2 pb-3 border-t">
					<div className="flex items-center justify-between w-full">
						<div className="flex items-center gap-2">
							{getStatusIcon()}
							<span className="text-sm">{getStatusText()}</span>
							{video.duration && (
								<span className="text-xs text-muted-foreground">
									• {formatDuration(video.duration)}
								</span>
							)}
						</div>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" className="h-8 w-8">
									<MoreVertical className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem className="text-red-600" onClick={onDelete}>
									<Trash2 className="h-4 w-4 mr-2" />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</CardFooter>
			</Card>
		);
	}

	// For processing/failed videos, show the original card
	return (
		<Card className="overflow-hidden hover:shadow-lg transition-shadow">
			<div className="relative aspect-video bg-muted">
				{video.thumbnailUrl ? (
					<img
						src={video.thumbnailUrl}
						alt={video.title}
						className="w-full h-full object-cover"
						crossOrigin="anonymous"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center">
						<Play className="h-12 w-12 text-muted-foreground" />
					</div>
				)}
				{video.duration && (
					<div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
						{formatDuration(video.duration)}
					</div>
				)}
				{video.status === "processing" && (
					<div className="absolute inset-0 bg-black/50 flex items-center justify-center">
						<Loader2 className="h-8 w-8 text-white animate-spin" />
					</div>
				)}
			</div>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex-1 min-w-0">
						<CardTitle className="text-base line-clamp-1">
							{video.title}
						</CardTitle>
						{video.description && (
							<CardDescription className="mt-1 line-clamp-2">
								{video.description}
							</CardDescription>
						)}
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="h-8 w-8">
								<MoreVertical className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem className="text-red-600" onClick={onDelete}>
								<Trash2 className="h-4 w-4 mr-2" />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</CardHeader>
			<CardContent className="pt-0 pb-2">
				{video.tags && (
					<div className="flex flex-wrap gap-1 mb-2">
						{video.tags
							.split(",")
							.slice(0, 3)
							.map((tag) => (
								<Badge key={tag.trim()} variant="secondary" className="text-xs">
									{tag.trim()}
								</Badge>
							))}
					</div>
				)}
				<div className="flex items-center justify-between text-xs text-muted-foreground">
					<span>{new Date(video.createdAt).toLocaleDateString()}</span>
					{video.fileSize && <span>{formatBytes(video.fileSize)}</span>}
				</div>
			</CardContent>
			<CardFooter className="pt-2 pb-3 border-t">
				<div className="flex items-center gap-2">
					{getStatusIcon()}
					<span className="text-sm">{getStatusText()}</span>
				</div>
			</CardFooter>
		</Card>
	);
}
