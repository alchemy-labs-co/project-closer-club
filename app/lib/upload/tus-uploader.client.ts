/**
 * TUS resumable upload implementation for Bunny.net Stream
 * Provides automatic resume capability and better error handling
 */

import * as tus from "tus-js-client";

export interface TusUploadOptions {
	file: File;
	uploadUrl: string;
	accessKey: string;
	onProgress?: (bytesUploaded: number, bytesTotal: number) => void;
	onSuccess?: () => void;
	onError?: (error: Error) => void;
	onChunkComplete?: (
		chunkSize: number,
		bytesUploaded: number,
		bytesTotal: number,
	) => void;
	metadata?: Record<string, string>;
	chunkSize?: number; // Default 50MB
	retryDelays?: number[]; // Retry delays in ms
}

export class TusUploader {
	private upload: tus.Upload | null = null;
	private options: TusUploadOptions;
	private aborted = false;

	constructor(options: TusUploadOptions) {
		this.options = {
			chunkSize: 50 * 1024 * 1024, // 50MB default
			retryDelays: [0, 3000, 5000, 10000, 20000], // Progressive delays
			...options,
		};
	}

	async start(): Promise<void> {
		if (this.upload) {
			throw new Error("Upload already in progress");
		}

		return new Promise((resolve, reject) => {
			this.upload = new tus.Upload(this.options.file, {
				endpoint: this.options.uploadUrl,
				chunkSize: this.options.chunkSize,
				retryDelays: this.options.retryDelays,
				metadata: {
					filename: this.options.file.name,
					filetype: this.options.file.type,
					...this.options.metadata,
				},
				headers: {
					AccessKey: this.options.accessKey,
				},
				onError: (error) => {
					console.error("TUS upload error:", error);
					this.options.onError?.(error);
					reject(error);
				},
				onProgress: (bytesUploaded, bytesTotal) => {
					this.options.onProgress?.(bytesUploaded, bytesTotal);
				},
				onChunkComplete: (chunkSize, bytesUploaded, bytesTotal) => {
					this.options.onChunkComplete?.(chunkSize, bytesUploaded, bytesTotal);
				},
				onSuccess: () => {
					console.log("TUS upload completed successfully");
					this.options.onSuccess?.();
					resolve();
				},
			});

			// Start the upload
			this.upload.start();
		});
	}

	pause(): void {
		if (this.upload) {
			this.upload.abort();
		}
	}

	resume(): void {
		if (this.upload && !this.aborted) {
			this.upload.start();
		}
	}

	abort(): void {
		this.aborted = true;
		if (this.upload) {
			this.upload.abort();
		}
	}

	getProgress(): { bytesUploaded: number; bytesTotal: number } | null {
		// TUS client doesn't expose progress directly, so we track it via onProgress
		return null;
	}

	isAborted(): boolean {
		return this.aborted;
	}

	// Get upload URL after creation (for resuming)
	getUploadUrl(): string | null {
		return this.upload?.url || null;
	}

	// Static method to resume an upload from a URL
	static async resumeUpload(
		file: File,
		uploadUrl: string,
		options: Omit<TusUploadOptions, "file" | "uploadUrl">,
	): Promise<TusUploader> {
		const uploader = new TusUploader({
			...options,
			file,
			uploadUrl,
		});

		// Set the upload URL for resuming
		if (uploader.upload) {
			uploader.upload.url = uploadUrl;
		}

		return uploader;
	}
}

// Utility function to format progress
export const formatTusProgress = (
	bytesUploaded: number,
	bytesTotal: number,
): string => {
	const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
	return `${percentage}% (${formatBytes(bytesUploaded)} / ${formatBytes(bytesTotal)})`;
};

// Utility function to format bytes
const formatBytes = (bytes: number): string => {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
};

// Check if TUS is supported by the environment
export const isTusSupported = (): boolean => {
	return typeof window !== "undefined" && "File" in window && "Blob" in window;
};
