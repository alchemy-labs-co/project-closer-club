import { VideoPlayer } from "~/components/ui/video-thumbnail-player";

export default function VideoPlayerDemo() {
	return (
		<div className="w-full max-w-2xl mx-auto p-4">
			<VideoPlayer
				thumbnailUrl="https://images.unsplash.com/photo-1593642532454-e138e28a63f4?q=80&w=2069&auto=format&fit=crop"
				videoUrl="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
				title="Building the Future"
				description="A look into modern architecture and design."
				className="rounded-xl"
			/>
		</div>
	);
}
