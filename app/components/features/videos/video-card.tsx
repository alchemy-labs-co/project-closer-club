import {
	Clock,
	MoreVertical,
	Play,
	CheckCircle,
	Loader2,
	XCircle,
	Trash2,
} from "lucide-react";
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
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { formatDuration, formatBytes } from "~/lib/utils";

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

	return (
		<Card className="overflow-hidden hover:shadow-lg transition-shadow">
			<div className="relative aspect-video bg-muted">
				{video.thumbnailUrl ? (
					<img
						src={video.thumbnailUrl}
						alt={video.title}
						className="w-full h-full object-cover"
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
							.map((tag, index) => (
								<Badge key={index} variant="secondary" className="text-xs">
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
