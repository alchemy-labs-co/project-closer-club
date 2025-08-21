import { ACCEPTED_FILE_TYPES } from "./zod-schemas/attachment";

// Video upload size limit - configurable via environment variable
// Default to 2GB if not set, can be overridden with MAX_VIDEO_SIZE_MB env var
export const MAX_VIDEO_SIZE = process.env.MAX_VIDEO_SIZE_MB
	? parseInt(process.env.MAX_VIDEO_SIZE_MB) * 1024 * 1024
	: 2 * 1024 * 1024 * 1024; // Default 2GB
export const MAX_THUMBNAIL_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB

// Video types accepted for upload
export const ACCEPTED_VIDEO_TYPES = {
	"video/mp4": [".mp4"],
	"video/avi": [".avi"],
	"video/mov": [".mov"],
	"video/wmv": [".wmv"],
	"video/webm": [".webm"],
	"video/mkv": [".mkv"],
};

// Convert ACCEPTED_FILE_TYPES array to object format for react-dropzone
export const DROPZONE_ACCEPTED_TYPES = ACCEPTED_FILE_TYPES.reduce(
	(acc, type) => {
		const extensions = {
			"application/pdf": [".pdf"],
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document":
				[".docx"],
			"application/msword": [".doc"],
			"image/png": [".png"],
			"image/jpg": [".jpg"],
			"image/jpeg": [".jpeg"],
			"text/plain": [".txt"],
			"text/csv": [".csv"],
			"text/markdown": [".md"],
			"application/x-markdown": [".markdown"],
		};
		acc[type] = extensions[type as keyof typeof extensions] || [];
		return acc;
	},
	{} as Record<string, string[]>,
);
