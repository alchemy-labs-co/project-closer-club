import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { dashboardConfig } from "~/config/dashboard";
// import { videos } from "~/db/schema";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function generateRandomPassword() {
	return Math.random().toString(36).substring(2, 10);
}

export const formatDateToString = (
	date: Date,
	options?: Intl.DateTimeFormatOptions,
) => {
	const dateFormated = new Date(date);
	return dateFormated.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
		...options,
	});
};

export function titleToSlug(title: string) {
	// lowercase the title
	const lowerCaseTitle = title.toLowerCase();
	// replace spaces with hyphens
	const hyphenatedTitle = lowerCaseTitle.replace(/ /g, "-");
	// remove special characters
	const slug = hyphenatedTitle.replace(/[^a-z0-9-]/g, "");
	return slug;
}

export function extractBunnyVideoId(url: string) {
	// library id is the first before the last one so we can split by /
	const libraryId = dashboardConfig.libraryId ?? url.split("/").slice(-2)[0];
	// video id
	const videoId = url.split("/").pop();
	return `${libraryId}/${videoId}`;
}

// format names displayname function (to display only the first 2 names of the user incase he may have 5 names)
export function displayName(name: string) {
	const names = name.split(" ");
	if (names.length > 2) {
		return `${names[0]} ${names[1]}`;
	}
	return name;
}

export const updateURLParams = (
	currentParams: URLSearchParams,
	updates: Record<string, string | null | undefined>,
	basePath: string = "/"
): string => {
	const params = new URLSearchParams(currentParams.toString());

	// Process each parameter update
	Object.entries(updates).forEach(([name, value]) => {
		if (value) {
			params.set(name, value);
		} else {
			params.delete(name);
		}
	});

	return `${basePath}?${params.toString()}`;
};

// Higher order function to handle errors
export const withErrorHandling = <T, A extends unknown[]>(
	fn: (...args: A) => Promise<T>
) => {
	return async (...args: A): Promise<T> => {
		try {
			const result = await fn(...args);
			return result;
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error occurred";
			return errorMessage as unknown as T;
		}
	};
};

// export const getOrderByClause = (filter?: string) => {
//   switch (filter) {
//     case "Most Viewed":
//       return sql`${videos.views} DESC`;
//     case "Least Viewed":
//       return sql`${videos.views} ASC`;
//     case "Oldest First":
//       return sql`${videos.createdAt} ASC`;
//     case "Most Recent":
//     default:
//       return sql`${videos.createdAt} DESC`;
//   }
// };

export const getVideoDuration = (url: string): Promise<number | null> =>
	new Promise((resolve) => {
		const video = document.createElement("video");
		video.preload = "metadata";
		video.onloadedmetadata = () => {
			const duration =
				isFinite(video.duration) && video.duration > 0
					? Math.round(video.duration)
					: null;
			URL.revokeObjectURL(video.src);
			resolve(duration);
		};
		video.onerror = () => {
			URL.revokeObjectURL(video.src);
			resolve(null);
		};
		video.src = url;
	});

// export const setupRecording = (
//   stream: MediaStream,
//   handlers: RecordingHandlers
// ): MediaRecorder => {
//   const recorder = new MediaRecorder(stream, DEFAULT_RECORDING_CONFIG);
//   recorder.ondataavailable = handlers.onDataAvailable;
//   recorder.onstop = handlers.onStop;
//   return recorder;
// };

export function parseTranscript(transcript: string): TranscriptEntry[] {
	const lines = transcript.replace(/^WEBVTT\s*/, "").split("\n");
	const result: TranscriptEntry[] = [];
	let tempText: string[] = [];
	let startTime: string | null = null;

	for (const line of lines) {
		const trimmedLine = line.trim();
		const timeMatch = trimmedLine.match(
			/(\d{2}:\d{2}:\d{2})\.\d{3}\s-->\s(\d{2}:\d{2}:\d{2})\.\d{3}/
		);

		if (timeMatch) {
			if (tempText.length > 0 && startTime) {
				result.push({ time: startTime, text: tempText.join(" ") });
				tempText = [];
			}
			startTime = timeMatch[1] ?? null;
		} else if (trimmedLine) {
			tempText.push(trimmedLine);
		}

		if (tempText.length >= 3 && startTime) {
			result.push({ time: startTime, text: tempText.join(" ") });
			tempText = [];
			startTime = null;
		}
	}

	if (tempText.length > 0 && startTime) {
		result.push({ time: startTime, text: tempText.join(" ") });
	}

	return result;
}

export function daysAgo(inputDate: Date): string {
	const input = new Date(inputDate);
	const now = new Date();

	const diffTime = now.getTime() - input.getTime();
	const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

	if (diffDays <= 0) {
		return "Today";
	} else if (diffDays === 1) {
		return "1 day ago";
	} else {
		return `${diffDays} days ago`;
	}
}

export const createIframeLink = (videoId: string) =>
	`https://iframe.mediadelivery.net/embed/455348/${videoId}?autoplay=true&preload=true`;

