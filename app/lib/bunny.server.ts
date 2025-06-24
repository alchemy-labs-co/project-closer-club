export const BUNNY = {
    STORAGE_BASE_URL: "https://storage.bunnycdn.com/closer-club-dev-storage",
    CDN_URL: "https://closer-club-dev.b-cdn.net",
    STREAM_BASE_URL: "https://video.bunnycdn.com/library",
    EMBED_URL: "https://iframe.mediadelivery.net/embed",
    TRANSCRIPT_URL: "https://vz-90e3bee1-e09.b-cdn.net",
};

const VIDEO_STREAM_BASE_URL = BUNNY.STREAM_BASE_URL;
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
    }
): Promise<T> => {
    const {
        method = "GET",
        headers = {},
        body,
        expectJson = true,
        bunnyType,
    } = options;

    const key = process.env[bunnyType === "stream"
        ? "BUNNY_STREAM_ACCESS_KEY"
        : "BUNNY_STORAGE_ACCESS_KEY"];

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

export const uploadThumbnailToBunny = async (
    file: File,
    courseId: string
): Promise<string> => {
    console.log("file", file);
    console.log("file.name", file.name);
    const fileExtension = file.name.split('.').pop();
    console.log("fileExtension", fileExtension);

    const { uploadUrl, cdnUrl, accessKey } = await getThumbnailUploadUrl(courseId);
    const finalUploadUrl = `${uploadUrl}.${fileExtension}`;
    const finalCdnUrl = `${cdnUrl}.${fileExtension}`;

    console.log("finalUploadUrl", finalUploadUrl);
    console.log("finalCdnUrl", finalCdnUrl);
    console.log("accessKey", accessKey);

    if (!accessKey) {
        console.error("🔴 Missing Bunny storage access key");
        throw new Error("Bunny storage access key not configured");
    }


    try {
        // Convert File to ArrayBuffer for raw binary upload
        const arrayBuffer = await file.arrayBuffer();
        console.log("arrayBuffer", arrayBuffer);
        const buffer = Buffer.from(arrayBuffer);

        const response = await fetch(finalUploadUrl, {
            method: 'PUT',
            headers: {
                'AccessKey': accessKey,
                'Content-Type': 'application/octet-stream',
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
                    'AccessKey': accessKey ? `${accessKey.substring(0, 5)}...` : 'missing',
                    'Content-Type': 'application/octet-stream'
                }
            });
            throw new Error(`Failed to upload thumbnail: ${response.status} - ${errorText}`);
        }

        return finalCdnUrl;

    } catch (error) {
        console.error("🔴 Upload process error:", {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            courseId,
            fileName: file.name,
            fileSize: file.size
        });
        throw error;
    }
};