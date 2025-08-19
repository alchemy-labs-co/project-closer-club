/**
 * Chunked video uploader for large files
 * Splits files into chunks and uploads sequentially to prevent memory issues
 */

export interface ChunkedUploadOptions {
	file: File;
	uploadUrl: string;
	accessKey: string;
	onProgress?: (progress: number) => void;
	onChunkProgress?: (chunkIndex: number, chunkProgress: number) => void;
	onSpeedUpdate?: (bytesPerSecond: number) => void;
	chunkSize?: number; // Default 50MB
	maxRetries?: number; // Default 3 retries per chunk
}

export interface UploadSession {
	fileId: string;
	totalChunks: number;
	uploadedChunks: Set<number>;
	uploadUrl: string;
	accessKey: string;
	createdAt: number;
}

const DEFAULT_CHUNK_SIZE = 50 * 1024 * 1024; // 50MB
const DEFAULT_MAX_RETRIES = 3;
const SESSION_STORAGE_KEY = "video-upload-sessions";

export class ChunkedUploader {
	private options: Required<ChunkedUploadOptions>;
	private totalChunks: number;
	private uploadedBytes = 0;
	private startTime = 0;
	private lastProgressTime = 0;
	private lastProgressBytes = 0;
	private aborted = false;
	private paused = false;
	private fileId: string;

	constructor(options: ChunkedUploadOptions) {
		this.options = {
			chunkSize: DEFAULT_CHUNK_SIZE,
			maxRetries: DEFAULT_MAX_RETRIES,
			onProgress: () => {},
			onChunkProgress: () => {},
			onSpeedUpdate: () => {},
			...options,
		};

		this.totalChunks = Math.ceil(
			this.options.file.size / this.options.chunkSize,
		);
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
				return {
					...session,
					uploadedChunks: new Set(session.uploadedChunks || []),
				};
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
			sessions[this.fileId] = {
				...session,
				uploadedChunks: Array.from(session.uploadedChunks),
			};
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

			this.options.onSpeedUpdate(bytesPerSecond);
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
		this.options.onProgress(progress);
		this.updateSpeed();
	}

	private async uploadChunk(chunkIndex: number): Promise<void> {
		if (this.aborted || this.paused) {
			throw new Error("Upload aborted or paused");
		}

		const start = chunkIndex * this.options.chunkSize;
		const end = Math.min(
			start + this.options.chunkSize,
			this.options.file.size,
		);
		const chunk = this.options.file.slice(start, end);

		let retries = 0;

		while (retries < this.options.maxRetries) {
			try {
				await this.uploadChunkWithProgress(chunk, chunkIndex, start, end);
				return;
			} catch (error) {
				retries++;
				if (retries >= this.options.maxRetries) {
					throw new Error(
						`Failed to upload chunk ${chunkIndex} after ${this.options.maxRetries} retries: ${error}`,
					);
				}
				// Wait before retry (exponential backoff)
				await new Promise((resolve) =>
					setTimeout(resolve, 2 ** retries * 1000),
				);
			}
		}
	}

	private uploadChunkWithProgress(
		chunk: Blob,
		chunkIndex: number,
		start: number,
		end: number,
	): Promise<void> {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();

			xhr.upload.addEventListener("progress", (event) => {
				if (event.lengthComputable && !this.aborted && !this.paused) {
					const chunkProgress = (event.loaded / event.total) * 100;
					this.options.onChunkProgress(chunkIndex, chunkProgress);
				}
			});

			xhr.addEventListener("load", () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					this.uploadedBytes += chunk.size;
					this.updateProgress();
					resolve();
				} else {
					reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
				}
			});

			xhr.addEventListener("error", () => {
				reject(new Error("Network error during chunk upload"));
			});

			xhr.addEventListener("timeout", () => {
				reject(new Error("Chunk upload timeout"));
			});

			// Use PATCH for chunk upload to Bunny Stream
			xhr.open("PATCH", this.options.uploadUrl);
			xhr.setRequestHeader("AccessKey", this.options.accessKey);
			xhr.setRequestHeader("Content-Type", "application/offset+octet-stream");
			xhr.setRequestHeader("Upload-Offset", start.toString());
			xhr.setRequestHeader("Content-Length", chunk.size.toString());
			xhr.timeout = 300000; // 5 minute timeout per chunk

			xhr.send(chunk);
		});
	}

	async upload(): Promise<void> {
		if (this.aborted) {
			throw new Error("Upload was aborted");
		}

		this.startTime = Date.now();

		// Try to resume from stored session
		const session = this.getStoredSession();
		const uploadedChunks = session?.uploadedChunks || new Set<number>();

		// Update uploaded bytes based on resumed chunks
		this.uploadedBytes = Array.from(uploadedChunks).reduce(
			(total, chunkIndex) => {
				const chunkStart = chunkIndex * this.options.chunkSize;
				const chunkEnd = Math.min(
					chunkStart + this.options.chunkSize,
					this.options.file.size,
				);
				return total + (chunkEnd - chunkStart);
			},
			0,
		);

		// Create or update session
		const currentSession: UploadSession = {
			fileId: this.fileId,
			totalChunks: this.totalChunks,
			uploadedChunks,
			uploadUrl: this.options.uploadUrl,
			accessKey: this.options.accessKey,
			createdAt: session?.createdAt || Date.now(),
		};

		try {
			// Upload remaining chunks sequentially
			for (let i = 0; i < this.totalChunks; i++) {
				if (this.aborted) {
					throw new Error("Upload aborted by user");
				}

				// Wait if paused
				while (this.paused && !this.aborted) {
					await new Promise((resolve) => setTimeout(resolve, 100));
				}

				if (uploadedChunks.has(i)) {
					// Skip already uploaded chunks
					continue;
				}

				await this.uploadChunk(i);

				// Mark chunk as completed and save progress
				currentSession.uploadedChunks.add(i);
				this.saveSession(currentSession);
			}

			// Clear session on successful completion
			this.clearSession();
		} catch (error) {
			// Save current progress before throwing
			this.saveSession(currentSession);
			throw error;
		}
	}

	pause(): void {
		this.paused = true;
	}

	resume(): void {
		this.paused = false;
	}

	abort(): void {
		this.aborted = true;
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
