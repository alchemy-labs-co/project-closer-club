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
	// Check if url already contains libraryId/videoGuid format
	if (url.includes("/")) {
		// Already in correct format, return as-is
		return url;
	}

	// Legacy format: just a GUID, use config libraryId
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
	basePath: string = "/",
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
	fn: (...args: A) => Promise<T>,
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
				Number.isFinite(video.duration) && video.duration > 0
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
			/(\d{2}:\d{2}:\d{2})\.\d{3}\s-->\s(\d{2}:\d{2}:\d{2})\.\d{3}/,
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

// Client-side upload utilities for Bunny CDN
export const uploadVideoDirectlyToBunny = async (
	file: File,
	uploadUrl: string,
	accessKey: string,
): Promise<boolean> => {
	try {
		const response = await fetch(uploadUrl, {
			method: "PUT",
			headers: {
				AccessKey: accessKey,
				"Content-Type": file.type,
			},
			body: file,
		});

		if (!response.ok) {
			console.error(
				"🔴 Direct video upload failed:",
				response.status,
				response.statusText,
			);
			return false;
		}

		return true;
	} catch (error) {
		console.error("🔴 Error uploading video directly to Bunny:", error);
		return false;
	}
};

export const uploadAttachmentDirectlyToBunny = async (
	file: File,
	uploadUrl: string,
	accessKey: string,
): Promise<boolean> => {
	try {
		const response = await fetch(uploadUrl, {
			method: "PUT",
			headers: {
				AccessKey: accessKey,
				"Content-Type": "application/octet-stream",
			},
			body: file,
		});

		if (!response.ok) {
			console.error(
				"🔴 Direct attachment upload failed:",
				response.status,
				response.statusText,
			);
			return false;
		}

		return true;
	} catch (error) {
		console.error("🔴 Error uploading attachment directly to Bunny:", error);
		return false;
	}
};

// Upload progress tracking utilities
export function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

export function formatDuration(seconds: number): string {
	if (!seconds || seconds === 0) return "0:00";
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;

	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	}
	return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export const uploadWithProgress = async (
	uploadUrl: string,
	file: File,
	options: {
		headers?: Record<string, string>;
	} = {},
	onProgress?: (progress: number) => void,
): Promise<boolean> => {
	return new Promise((resolve) => {
		const xhr = new XMLHttpRequest();

		// Track upload progress
		if (onProgress) {
			xhr.upload.addEventListener("progress", (e) => {
				if (e.lengthComputable) {
					const progress = Math.round((e.loaded / e.total) * 100);
					onProgress(progress);
				}
			});
		}

		xhr.addEventListener("load", () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve(true);
			} else {
				console.error("🔴 Upload failed:", xhr.status, xhr.statusText);
				resolve(false);
			}
		});

		xhr.addEventListener("error", () => {
			console.error("🔴 Upload error");
			resolve(false);
		});

		xhr.open("PUT", uploadUrl);

		// Set headers from options
		if (options.headers) {
			Object.entries(options.headers).forEach(([key, value]) => {
				xhr.setRequestHeader(key, value);
			});
		}

		xhr.send(file);
	});
};

// convert slug to title
// replace the dashes + capitalize the first letter of each word
export const slugToTitle = (slug: string) => {
	return slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

// Client-safe function to generate video thumbnail URLs
export const getVideoThumbnailUrl = (
	libraryId: string,
	videoGuid: string,
	thumbnailFileName?: string,
): string => {
	// Use Bunny.net CDN pull zone URL for thumbnails
	// Format: https://vz-{libraryId}-a.b-cdn.net/{videoGuid}/{thumbnailFile}
	const pullZoneUrl = `https://vz-${libraryId}-a.b-cdn.net`;

	if (thumbnailFileName) {
		return `${pullZoneUrl}/${videoGuid}/${thumbnailFileName}`;
	}
	// Default thumbnail - Bunny generates this automatically
	return `${pullZoneUrl}/${videoGuid}/thumbnail.jpg`;
};

// Client-safe function to generate video embed URLs for playback
export const getVideoEmbedUrl = (
	libraryId: string,
	videoGuid: string,
	autoplay = true,
): string => {
	const embedUrl = "https://iframe.mediadelivery.net/embed";
	const baseUrl = `${embedUrl}/${libraryId}/${videoGuid}`;
	return autoplay ? `${baseUrl}?autoplay=1` : baseUrl;
};
