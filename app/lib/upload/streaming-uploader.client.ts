/**
 * Streaming video uploader for large files
 * Provides enhanced progress tracking and memory management for Bunny.net uploads
 * Uses a single PUT request as required by Bunny.net Stream API
 */

export interface StreamingUploadOptions {
	file: File;
	uploadUrl: string;
	accessKey: string;
	onProgress?: (progress: number) => void;
	onSpeedUpdate?: (bytesPerSecond: number) => void;
	onError?: (error: Error) => void;
	onSuccess?: () => void;
}

export interface UploadSession {
	fileId: string;
	uploadUrl: string;
	accessKey: string;
	createdAt: number;
	completed: boolean;
}

const SESSION_STORAGE_KEY = "video-upload-sessions";

export class StreamingUploader {
	private options: StreamingUploadOptions;
	private xhr: XMLHttpRequest | null = null;
	private uploadedBytes: number = 0;
	private startTime: number = 0;
	private lastProgressTime: number = 0;
	private lastProgressBytes: number = 0;
	private aborted = false;
	private paused = false;
	private fileId: string;

	constructor(options: StreamingUploadOptions) {
		this.options = {
			onProgress: () => {},
			onSpeedUpdate: () => {},
			onError: () => {},
			onSuccess: () => {},
			...options,
		};

		this.fileId = this.generateFileId(this.options.file);
	}

	private generateFileId(file: File): string {
		return `${file.name}-${file.size}-${file.lastModified}`;
	}

	private getStoredSession(): UploadSession | null {
		try {
			const sessions = JSON.parse(
				localStorage.getItem(SESSION_STORAGE_KEY) || "{}",
			);
			const session = sessions[this.fileId];

			if (session && session.uploadUrl === this.options.uploadUrl) {
				return session;
			}
		} catch (error) {
			console.warn("Failed to load upload session:", error);
		}
		return null;
	}

	private saveSession(session: UploadSession): void {
		try {
			const sessions = JSON.parse(
				localStorage.getItem(SESSION_STORAGE_KEY) || "{}",
			);
			sessions[this.fileId] = session;
			localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
		} catch (error) {
			console.warn("Failed to save upload session:", error);
		}
	}

	private clearSession(): void {
		try {
			const sessions = JSON.parse(
				localStorage.getItem(SESSION_STORAGE_KEY) || "{}",
			);
			delete sessions[this.fileId];
			localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
		} catch (error) {
			console.warn("Failed to clear upload session:", error);
		}
	}

	private updateSpeed(): void {
		const now = Date.now();
		if (this.lastProgressTime && now - this.lastProgressTime > 1000) {
			const timeDiff = now - this.lastProgressTime;
			const bytesDiff = this.uploadedBytes - this.lastProgressBytes;
			const bytesPerSecond = (bytesDiff * 1000) / timeDiff;

			this.options.onSpeedUpdate?.(bytesPerSecond);
			this.lastProgressTime = now;
			this.lastProgressBytes = this.uploadedBytes;
		} else if (!this.lastProgressTime) {
			this.lastProgressTime = now;
			this.lastProgressBytes = this.uploadedBytes;
		}
	}

	private updateProgress(): void {
		const progress = Math.round(
			(this.uploadedBytes / this.options.file.size) * 100,
		);
		this.options.onProgress?.(progress);
		this.updateSpeed();
	}

	async upload(): Promise<void> {
		if (this.aborted) {
			throw new Error("Upload was aborted");
		}

		// Check if already completed
		const session = this.getStoredSession();
		if (session?.completed) {
			this.options.onSuccess?.();
			return;
		}

		this.startTime = Date.now();
		this.lastProgressTime = this.startTime;
		this.lastProgressBytes = 0;

		// Create session
		const currentSession: UploadSession = {
			fileId: this.fileId,
			uploadUrl: this.options.uploadUrl,
			accessKey: this.options.accessKey,
			createdAt: session?.createdAt || Date.now(),
			completed: false,
		};

		this.saveSession(currentSession);

		return new Promise((resolve, reject) => {
			try {
				this.xhr = new XMLHttpRequest();

				// Progress tracking
				this.xhr.upload.addEventListener("progress", (event) => {
					if (event.lengthComputable && !this.aborted && !this.paused) {
						this.uploadedBytes = event.loaded;
						this.updateProgress();
					}
				});

				// Success handler
				this.xhr.addEventListener("load", () => {
					if (this.xhr && this.xhr.status >= 200 && this.xhr.status < 300) {
						// Mark as completed and clear session
						currentSession.completed = true;
						this.saveSession(currentSession);
						this.clearSession();

						this.options.onSuccess?.();
						resolve();
					} else {
						const error = new Error(`Upload failed: HTTP ${this.xhr?.status}`);
						this.options.onError?.(error);
						reject(error);
					}
				});

				// Error handlers
				this.xhr.addEventListener("error", () => {
					const error = new Error("Network error during upload");
					this.options.onError?.(error);
					reject(error);
				});

				this.xhr.addEventListener("timeout", () => {
					const error = new Error("Upload timeout");
					this.options.onError?.(error);
					reject(error);
				});

				this.xhr.addEventListener("abort", () => {
					if (!this.aborted) {
						const error = new Error("Upload was aborted");
						this.options.onError?.(error);
						reject(error);
					}
				});

				// Configure and send request
				this.xhr.open("PUT", this.options.uploadUrl);
				this.xhr.setRequestHeader("AccessKey", this.options.accessKey);
				this.xhr.setRequestHeader("Content-Type", this.options.file.type);
				this.xhr.timeout = 0; // No timeout for large files

				// Start upload
				this.xhr.send(this.options.file);
			} catch (error) {
				const uploadError =
					error instanceof Error ? error : new Error("Upload failed");
				this.options.onError?.(uploadError);
				reject(uploadError);
			}
		});
	}

	pause(): void {
		this.paused = true;
		if (this.xhr) {
			this.xhr.abort();
		}
	}

	resume(): void {
		if (this.paused && !this.aborted) {
			this.paused = false;
			// For Bunny.net, we need to restart the upload completely
			// since it doesn't support true resumable uploads
			this.upload().catch((error) => {
				console.error("Resume upload failed:", error);
				this.options.onError?.(error);
			});
		}
	}

	abort(): void {
		this.aborted = true;
		if (this.xhr) {
			this.xhr.abort();
		}
		this.clearSession();
	}

	isPaused(): boolean {
		return this.paused;
	}

	isAborted(): boolean {
		return this.aborted;
	}

	getProgress(): number {
		return Math.round((this.uploadedBytes / this.options.file.size) * 100);
	}

	getUploadedBytes(): number {
		return this.uploadedBytes;
	}

	getTotalBytes(): number {
		return this.options.file.size;
	}

	// Clean up old sessions (call periodically)
	static cleanupOldSessions(maxAgeHours = 24): void {
		try {
			const sessions = JSON.parse(
				localStorage.getItem(SESSION_STORAGE_KEY) || "{}",
			);
			const cutoffTime = Date.now() - maxAgeHours * 60 * 60 * 1000;

			for (const fileId of Object.keys(sessions)) {
				if (sessions[fileId].createdAt < cutoffTime) {
					delete sessions[fileId];
				}
			}

			localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
		} catch (error) {
			console.warn("Failed to cleanup old upload sessions:", error);
		}
	}
}

// Utility functions
export const formatUploadSpeed = (bytesPerSecond: number): string => {
	const units = ["B/s", "KB/s", "MB/s", "GB/s"];
	let speed = bytesPerSecond;
	let unitIndex = 0;

	while (speed >= 1024 && unitIndex < units.length - 1) {
		speed /= 1024;
		unitIndex++;
	}

	return `${speed.toFixed(1)} ${units[unitIndex]}`;
};

export const formatTimeRemaining = (
	bytesRemaining: number,
	bytesPerSecond: number,
): string => {
	if (bytesPerSecond === 0) return "Calculating...";

	const secondsRemaining = bytesRemaining / bytesPerSecond;

	if (secondsRemaining < 60) {
		return `${Math.round(secondsRemaining)}s remaining`;
	}
	if (secondsRemaining < 3600) {
		return `${Math.round(secondsRemaining / 60)}m remaining`;
	}
	const hours = Math.floor(secondsRemaining / 3600);
	const minutes = Math.round((secondsRemaining % 3600) / 60);
	return `${hours}h ${minutes}m remaining`;
};
