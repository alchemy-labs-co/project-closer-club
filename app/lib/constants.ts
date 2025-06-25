import { ACCEPTED_FILE_TYPES } from "./zod-schemas/attachment";

export const MAX_VIDEO_SIZE = 500 * 1024 * 1024;
export const MAX_THUMBNAIL_SIZE = 10 * 1024 * 1024;
export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

// Convert ACCEPTED_FILE_TYPES array to object format for react-dropzone
export const DROPZONE_ACCEPTED_TYPES = ACCEPTED_FILE_TYPES.reduce((acc, type) => {
    const extensions = {
        "application/pdf": [".pdf"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
            ".docx",
        ],
        "application/msword": [".doc"],
        "image/png": [".png"],
        "image/jpg": [".jpg"],
        "image/jpeg": [".jpeg"],
    };
    acc[type] = extensions[type as keyof typeof extensions] || [];
    return acc;
}, {} as Record<string, string[]>);