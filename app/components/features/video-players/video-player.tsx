import type { VideoPlayerTypes } from "~/lib/types";
import {
	extractBunnyVideoId,
	extractVimeoVideoId,
	extractYoutubeVideoId,
} from "~/lib/utils";

export function VideoPlayer({ type, url }: VideoPlayerTypes) {
	return (
		<div className="video-container">
			{type === "Youtube" && <YoutubePlayer url={url} />}
			{type === "Vimeo" && <VimeoPlayer url={url} />}
			{type === "Bunny" && <BunnyPlayer url={url} />}
		</div>
	);
}

function YoutubePlayer({ url }: { url: VideoPlayerTypes["url"] }) {
	return (
		<>
			<iframe
				src={`https://www.youtube.com/embed/${extractYoutubeVideoId(
					url
				)}?modestbranding=1&rel=0&showinfo=0&controls=1`}
				frameBorder="0"
				allowFullScreen
				title="My Video"
			/>
		</>
	);
}

function VimeoPlayer({ url }: { url: VideoPlayerTypes["url"] }) {
	return (
		<iframe
			src={`https://player.vimeo.com/${extractVimeoVideoId(url)}`}
			frameBorder="0"
			allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
			title="My Video"
		/>
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
