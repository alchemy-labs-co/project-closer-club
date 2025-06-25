import type { VideoPlayerTypes } from "~/lib/types";
import { extractBunnyVideoId } from "~/lib/utils";

export function VideoPlayer({ type, url }: VideoPlayerTypes) {
	return (
		<div className="video-container">
			{type === "Bunny" && <BunnyPlayer url={url} />}
		</div>
	);
}

function BunnyPlayer({ url }: { url: VideoPlayerTypes["url"] }) {
	return (
		<iframe
			src={`https://iframe.mediadelivery.net/embed/${extractBunnyVideoId(url)}`}
			frameBorder="0"
			allowFullScreen
			title="My Video"
		/>
	);
}
