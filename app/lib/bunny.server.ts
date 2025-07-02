export const BUNNY = {
	STORAGE_BASE_URL: "https://storage.bunnycdn.com/closer-club-storage",
	CDN_URL: "https://closer-club-pull-zone.b-cdn.net",
	STREAM_BASE_URL: "https://video.bunnycdn.com/library",
	EMBED_URL: "https://iframe.mediadelivery.net/embed",
};
const THUMBNAIL_STORAGE_BASE_URL = BUNNY.STORAGE_BASE_URL;
const THUMBNAIL_CDN_URL = BUNNY.CDN_URL;
const ACCESS_KEYS = {
	storageAccessKey: process.env.BUNNY_STORAGE_ACCESS_KEY,
	streamAccessKey: process.env.BUNNY_STREAM_ACCESS_KEY,
};

// API fetch helper with required Bunny CDN options
// API fetch helper with required Bunny CDN options
export const bunnyApiFetch = async <T = Record<string, unknown>>(
	url: string,
	options: Omit<ApiFetchOptions, "bunnyType"> & {
		bunnyType: "stream" | "storage";
	},
): Promise<T> => {
	const {
		method = "GET",
		headers = {},
		body,
		expectJson = true,
		bunnyType,
	} = options;

	const key =
		process.env[
		bunnyType === "stream"
			? "BUNNY_STREAM_ACCESS_KEY"
			: "BUNNY_STORAGE_ACCESS_KEY"
		];

	const requestHeaders = {
		...headers,
		AccessKey: key || "",
		...(bunnyType === "stream" && {
			accept: "application/json",
			...(body && { "content-type": "application/json" }),
		}),
	};

	const requestOptions: RequestInit = {
		method,
		headers: requestHeaders,
		...(body && { body: JSON.stringify(body) }),
	};

	const response = await fetch(url, requestOptions);

	if (!response.ok) {
		throw new Error(`API error ${response.text()}`);
	}

	if (method === "DELETE" || !expectJson) {
		return true as T;
	}

	return await response.json();
};

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

export const getThumbnailUploadUrl = async (courseId: string) => {
	const timestampedFileName = `${Date.now()}-${courseId}-thumbnail`;
	const uploadUrl = `${THUMBNAIL_STORAGE_BASE_URL}/thumbnails/${timestampedFileName}`;
	const cdnUrl = `${THUMBNAIL_CDN_URL}/thumbnails/${timestampedFileName}`;

	return {
		uploadUrl,
		cdnUrl,
		accessKey: ACCESS_KEYS.storageAccessKey,
	};
};

export const getAttachmentUploadUrl = async (
	lessonId: string,
	originalFileName: string,
) => {
	const fileExtension = originalFileName.split(".").pop() || "";
	const timestampedFileName = `${Date.now()}-${lessonId}-${originalFileName}`;
	const uploadUrl = `${THUMBNAIL_STORAGE_BASE_URL}/attachments/${timestampedFileName}`;
	const cdnUrl = `${THUMBNAIL_CDN_URL}/attachments/${timestampedFileName}`;

	return {
		uploadUrl,
		cdnUrl,
		accessKey: ACCESS_KEYS.storageAccessKey,
		fileExtension,
		fileName: originalFileName,
	};
};

export const uploadThumbnailToBunny = async (
	file: File,
	courseId: string,
): Promise<string> => {
	const fileExtension = file.name.split(".").pop();

	const { uploadUrl, cdnUrl, accessKey } =
		await getThumbnailUploadUrl(courseId);
	const finalUploadUrl = `${uploadUrl}.${fileExtension}`;
	const finalCdnUrl = `${cdnUrl}.${fileExtension}`;

	if (!accessKey) {
		console.error("🔴 Missing Bunny storage access key");
		throw new Error("Bunny storage access key not configured");
	}

	try {
		// Convert File to ArrayBuffer for raw binary upload
		const arrayBuffer = await file.arrayBuffer();

		const buffer = Buffer.from(arrayBuffer);

		const response = await fetch(finalUploadUrl, {
			method: "PUT",
			headers: {
				AccessKey: accessKey,
				"Content-Type": "application/octet-stream",
			},
			body: buffer,
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error("🔴 Upload failed:", {
				status: response.status,
				statusText: response.statusText,
				errorText,
				finalUploadUrl,
				requestHeaders: {
					AccessKey: accessKey ? `${accessKey.substring(0, 5)}...` : "missing",
					"Content-Type": "application/octet-stream",
				},
			});
			throw new Error(
				`Failed to upload thumbnail: ${response.status} - ${errorText}`,
			);
		}

		return finalCdnUrl;
	} catch (error) {
		console.error("🔴 Upload process error:", {
			error: error instanceof Error ? error.message : "Unknown error",
			stack: error instanceof Error ? error.stack : undefined,
			courseId,
			fileName: file.name,
			fileSize: file.size,
		});
		throw error;
	}
};

export const uploadAttachmentToBunny = async (
	file: File,
	lessonId: string,
): Promise<{ cdnUrl: string; fileExtension: string; fileName: string }> => {
	const { uploadUrl, cdnUrl, accessKey, fileExtension, fileName } =
		await getAttachmentUploadUrl(lessonId, file.name);
	const finalUploadUrl = uploadUrl;
	const finalCdnUrl = cdnUrl;

	if (!accessKey) {
		console.error("🔴 Missing Bunny storage access key");
		throw new Error("Bunny storage access key not configured");
	}

	try {
		// Convert File to ArrayBuffer for raw binary upload
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		const response = await fetch(finalUploadUrl, {
			method: "PUT",
			headers: {
				AccessKey: accessKey,
				"Content-Type": "application/octet-stream",
			},
			body: buffer,
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error("🔴 Attachment upload failed:", {
				status: response.status,
				statusText: response.statusText,
				errorText,
				finalUploadUrl,
				fileName: file.name,
			});
			throw new Error(
				`Failed to upload attachment: ${response.status} - ${errorText}`,
			);
		}

		return {
			cdnUrl: finalCdnUrl,
			fileExtension,
			fileName,
		};
	} catch (error) {
		console.error("🔴 Attachment upload process error:", {
			error: error instanceof Error ? error.message : "Unknown error",
			lessonId,
			fileName: file.name,
			fileSize: file.size,
		});
		throw error;
	}
};

export const deleteAttachmentFromBunny = async (
	fileUrl: string,
): Promise<void> => {
	if (!fileUrl) {
		throw new Error("File URL is required for deletion");
	}

	// Extract the file path from the CDN URL
	// Example URL: https://closer-club-dev.b-cdn.net/attachments/1234567890-lessonId-filename.pdf
	// We need to extract: attachments/1234567890-lessonId-filename.pdf
	const cdnBaseUrl = BUNNY.CDN_URL;
	if (!fileUrl.startsWith(cdnBaseUrl)) {
		throw new Error("Invalid file URL - not from our CDN");
	}

	// Remove the CDN base URL to get the file path
	const filePath = fileUrl.replace(`${cdnBaseUrl}/`, "");

	// Construct the storage API delete URL
	const deleteUrl = `${BUNNY.STORAGE_BASE_URL}/${filePath}`;

	const accessKey = ACCESS_KEYS.storageAccessKey;

	if (!accessKey) {
		console.error("🔴 Missing Bunny storage access key");
		throw new Error("Bunny storage access key not configured");
	}

	try {
		const response = await fetch(deleteUrl, {
			method: "DELETE",
			headers: {
				AccessKey: accessKey,
			},
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error("🔴 Delete failed:", {
				status: response.status,
				statusText: response.statusText,
				errorText,
				deleteUrl,
				filePath,
			});
			throw new Error(
				`Failed to delete attachment from Bunny: ${response.status} - ${errorText}`,
			);
		}
	} catch (error) {
		console.error("🔴 Attachment deletion error:", {
			error: error instanceof Error ? error.message : "Unknown error",
			fileUrl,
			filePath,
		});
		throw error;
	}
};

// Types for Bunny Stream API
interface CreateVideoResponse {
	videoLibraryId: number;
	guid: string;
	title: string;
	description?: string;
	dateUploaded: string;
	views: number;
	isPublic: boolean;
	length: number;
	status: number;
	framerate: number;
	rotation?: number;
	width: number;
	height: number;
	availableResolutions?: string;
	outputCodecs?: string;
	thumbnailCount: number;
	encodeProgress: number;
	storageSize: number;
	hasMP4Fallback: boolean;
	collectionId?: string;
	thumbnailFileName?: string;
	averageWatchTime: number;
	totalWatchTime: number;
	category?: string;
}

interface ApiFetchOptions {
	method?: "GET" | "POST" | "PUT" | "DELETE";
	headers?: Record<string, string>;
	body?: Record<string, unknown>;
	expectJson?: boolean;
}

// Create a video in Bunny Stream Library
export const createVideoInBunnyStream = async (
	title: string,
	libraryId: string,
	collectionId?: string,
	thumbnailTime?: number,
): Promise<CreateVideoResponse> => {
	const url = `${BUNNY.STREAM_BASE_URL}/${libraryId}/videos`;

	const body: Record<string, unknown> = {
		title,
	};

	if (collectionId) {
		body.collectionId = collectionId;
	}

	if (thumbnailTime) {
		body.thumbnailTime = thumbnailTime;
	}

	return await bunnyApiFetch<CreateVideoResponse>(url, {
		method: "POST",
		body,
		bunnyType: "stream",
	});
};

// Upload video file to Bunny Stream
export const uploadVideoToBunnyStream = async (
	file: File,
	videoId: string,
	libraryId: string,
): Promise<void> => {
	const uploadUrl = `${BUNNY.STREAM_BASE_URL}/${libraryId}/videos/${videoId}`;

	const accessKey = ACCESS_KEYS.streamAccessKey;

	if (!accessKey) {
		console.error("🔴 Missing Bunny stream access key");
		throw new Error("Bunny stream access key not configured");
	}

	try {
		// Convert File to ArrayBuffer for raw binary upload
		// const arrayBuffer = await file.arrayBuffer();
		// const buffer = Buffer.from(arrayBuffer);

		const response = await fetch(uploadUrl, {
			method: "PUT",
			headers: {
				AccessKey: accessKey,
				"Content-Type": file.type,
			},
			body: file,
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error("🔴 Video upload failed:", {
				status: response.status,
				statusText: response.statusText,
				errorText,
				uploadUrl,
				fileName: file.name,
			});
			throw new Error(
				`Failed to upload video: ${response.status} - ${errorText}`,
			);
		}
	} catch (error) {
		console.error("🔴 Video upload process error:", {
			error: error instanceof Error ? error.message : "Unknown error",
			videoId,
			libraryId,
			fileName: file.name,
			fileSize: file.size,
		});
		throw error;
	}
};

// Combined function to create video and upload file
export const createAndUploadVideoToBunnyStream = async (
	file: File,
	title: string,
	libraryId: string,
	collectionId?: string,
	thumbnailTime?: number,
): Promise<string> => {
	try {
		// Step 1: Create video in library
		const videoResponse = await createVideoInBunnyStream(
			title,
			libraryId,
			collectionId,
			thumbnailTime,
		);

		// Step 2: Upload the actual video file
		await uploadVideoToBunnyStream(file, videoResponse.guid, libraryId);

		// Return the video GUID (this will be stored as videoUrl in the database)
		return videoResponse.guid;
	} catch (error) {
		console.error("🔴 Create and upload video error:", {
			error: error instanceof Error ? error.message : "Unknown error",
			title,
			libraryId,
			fileName: file.name,
			fileSize: file.size,
		});
		throw error;
	}
};

// Generate pre-signed URL for direct video upload to Bunny Stream
export const generateVideoUploadToken = async (
	title: string,
	libraryId: string,
	collectionId?: string,
	thumbnailTime?: number,
) => {
	try {
		// Step 1: Create video in library to get the GUID
		const videoResponse = await createVideoInBunnyStream(
			title,
			libraryId,
			collectionId,
			thumbnailTime,
		);

		// Step 2: Return upload URL and video GUID for client-side upload
		const uploadUrl = `${BUNNY.STREAM_BASE_URL}/${libraryId}/videos/${videoResponse.guid}`;

		return {
			videoGuid: videoResponse.guid,
			uploadUrl,
			accessKey: ACCESS_KEYS.streamAccessKey,
			videoResponse,
		};
	} catch (error) {
		console.error("🔴 Error generating video upload token:", error);
		throw error;
	}
};

// Generate pre-signed URL for direct attachment upload to Bunny Storage
export const generateAttachmentUploadToken = async (
	lessonId: string,
	fileName: string,
) => {
	try {
		const { uploadUrl, cdnUrl, accessKey, fileExtension } =
			await getAttachmentUploadUrl(lessonId, fileName);

		return {
			uploadUrl,
			cdnUrl,
			accessKey,
			fileExtension,
			fileName,
		};
	} catch (error) {
		console.error("🔴 Error generating attachment upload token:", error);
		throw error;
	}
};

// Function to confirm video upload completion (called after client-side upload)
export const confirmVideoUpload = async (
	videoGuid: string,
	libraryId: string,
) => {
	try {
		// You can add any post-upload verification here if needed
		// For now, just return the GUID as confirmation
		return { success: true, videoGuid };
	} catch (error) {
		console.error("🔴 Error confirming video upload:", error);
		throw error;
	}
};

export const getCertificateUploadUrl = async (
	studentId: string,
	courseSlug: string,
) => {
	const timestampedFileName = `${Date.now()}-${studentId}-${courseSlug}-certificate`;
	const uploadUrl = `${BUNNY.STORAGE_BASE_URL}/certificates/${timestampedFileName}.png`;
	const cdnUrl = `${BUNNY.CDN_URL}/certificates/${timestampedFileName}.png`;

	return {
		uploadUrl,
		cdnUrl,
		accessKey: ACCESS_KEYS.storageAccessKey,
		fileName: `${timestampedFileName}.png`,
	};
};

export const uploadCertificateToBunny = async (
	imageBuffer: ArrayBuffer,
	studentId: string,
	courseSlug: string,
): Promise<string> => {
	const { uploadUrl, cdnUrl, accessKey } = await getCertificateUploadUrl(
		studentId,
		courseSlug,
	);

	if (!accessKey) {
		console.error("🔴 Missing Bunny storage access key");
		throw new Error("Bunny storage access key not configured");
	}

	try {
		const buffer = Buffer.from(imageBuffer);

		const response = await fetch(uploadUrl, {
			method: "PUT",
			headers: {
				AccessKey: accessKey,
				"Content-Type": "image/png",
			},
			body: buffer,
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error("🔴 Certificate upload failed:", {
				status: response.status,
				statusText: response.statusText,
				errorText,
				uploadUrl,
			});
			throw new Error(
				`Failed to upload certificate: ${response.status} - ${errorText}`,
			);
		}

		return cdnUrl;
	} catch (error) {
		console.error("🔴 Certificate upload process error:", {
			error: error instanceof Error ? error.message : "Unknown error",
			studentId,
			courseSlug,
		});
		throw error;
	}
};
