import {
	AlertCircle,
	Trash2,
	Upload,
	Video,
	X,
	FileVideo,
	Film,
	CheckCircle,
	Pause,
	Play,
	Square,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Progress } from "~/components/ui/progress";
import {
	useFileUpload,
	formatBytes,
	type FileWithPreview,
} from "~/hooks/use-file-upload";
import { MAX_VIDEO_SIZE } from "~/lib/constants";
import type { FetcherResponse } from "~/lib/types";
import {
	StreamingUploader,
	formatUploadSpeed,
	formatTimeRemaining,
} from "~/lib/upload/streaming-uploader.client";

type UploadVideoFetcherResponse = FetcherResponse & {
	videoId?: string;
	uploadUrl?: string;
	accessKey?: string;
	videoGuid?: string;
};

type UploadProgress = {
	[fileId: string]: number;
};

type UploadSpeed = {
	[fileId: string]: number; // bytes per second
};

type UploadMethod = "direct" | "chunked";

type ActiveUploader = {
	[fileId: string]: StreamingUploader | null;
};

interface VideoUploadSectionProps {
	onUploadComplete?: () => void;
	onCancel?: () => void;
}

const getFileIcon = (file: FileWithPreview) => {
	const fileType = file.file instanceof File ? file.file.type : file.file.type;

	if (fileType.startsWith("video/")) {
		return <Video className="size-5 opacity-60" />;
	}
	return <FileVideo className="size-5 opacity-60" />;
};

const getFilePreview = (file: FileWithPreview) => {
	const fileName = file.file instanceof File ? file.file.name : file.file.name;

	return (
		<div className="bg-accent flex aspect-video items-center justify-center overflow-hidden rounded-t-[inherit]">
			<div className="flex flex-col items-center gap-2">
				<Film className="size-8 opacity-60" />
				<p className="text-xs text-muted-foreground truncate max-w-[150px] px-2">
					{fileName}
				</p>
			</div>
		</div>
	);
};

export function VideoUploadSection({
	onUploadComplete,
	onCancel,
}: VideoUploadSectionProps) {
	const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
	const [uploadSpeed, setUploadSpeed] = useState<UploadSpeed>({});
	const [activeUploaders, setActiveUploaders] = useState<ActiveUploader>({});
	const [videoMetadata, setVideoMetadata] = useState<{
		[fileId: string]: {
			title: string;
			description: string;
			tags: string[];
		};
	}>({});
	const [tagInputs, setTagInputs] = useState<{ [fileId: string]: string }>({});
	const [uploadedVideos, setUploadedVideos] = useState<Set<string>>(new Set());
	const [pausedUploads, setPausedUploads] = useState<Set<string>>(new Set());

	const fetcher = useFetcher<UploadVideoFetcherResponse>();

	const maxFiles = 5;
	const maxSizeMB = Math.round(MAX_VIDEO_SIZE / (1024 * 1024));

	const [
		{ files, isDragging, errors },
		{
			handleDragEnter,
			handleDragLeave,
			handleDragOver,
			handleDrop,
			openFileDialog,
			removeFile,
			clearFiles,
			getInputProps,
		},
	] = useFileUpload({
		multiple: true,
		maxFiles,
		maxSize: MAX_VIDEO_SIZE,
		accept: "video/*",
		onFilesAdded: (addedFiles) => {
			// Initialize metadata for new files
			addedFiles.forEach((file) => {
				const fileName =
					file.file instanceof File ? file.file.name : file.file.name;
				const titleFromFile = fileName
					.replace(/\.[^/.]+$/, "") // Remove extension
					.replace(/[-_]/g, " ") // Replace dashes/underscores with spaces
					.replace(/\b\w/g, (l) => l.toUpperCase()); // Capitalize words

				setVideoMetadata((prev) => ({
					...prev,
					[file.id]: {
						title: titleFromFile,
						description: "",
						tags: [],
					},
				}));
			});
		},
	});

	// Cleanup function to run on component unmount
	useEffect(() => {
		return () => {
			// Cleanup old upload sessions on unmount
			StreamingUploader.cleanupOldSessions(24);
		};
	}, []);

	// Determine optimal upload method based on file size
	const getUploadMethod = (fileSize: number): UploadMethod => {
		const CHUNK_THRESHOLD = 100 * 1024 * 1024; // 100MB

		if (fileSize > CHUNK_THRESHOLD) {
			return "chunked"; // Use streaming upload for large files
		} else {
			return "direct"; // Use direct upload for smaller files
		}
	};

	const handleMetadataChange = (
		fileId: string,
		field: "title" | "description",
		value: string,
	) => {
		setVideoMetadata((prev) => ({
			...prev,
			[fileId]: {
				...prev[fileId],
				[field]: value,
			},
		}));
	};

	const handleAddTag = (fileId: string, e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			const tagValue = tagInputs[fileId]?.trim();
			if (tagValue && !videoMetadata[fileId]?.tags.includes(tagValue)) {
				setVideoMetadata((prev) => ({
					...prev,
					[fileId]: {
						...prev[fileId],
						tags: [...(prev[fileId]?.tags || []), tagValue],
					},
				}));
				setTagInputs((prev) => ({ ...prev, [fileId]: "" }));
			}
		}
	};

	const removeTag = (fileId: string, tagToRemove: string) => {
		setVideoMetadata((prev) => ({
			...prev,
			[fileId]: {
				...prev[fileId],
				tags: prev[fileId].tags.filter((tag) => tag !== tagToRemove),
			},
		}));
	};

	const uploadVideo = async (file: FileWithPreview) => {
		const videoFile = file.file;
		if (!(videoFile instanceof File)) return;

		const metadata = videoMetadata[file.id];
		if (!metadata?.title) {
			toast.error("Please provide a title for all videos");
			return;
		}

		try {
			// Step 1: Get upload token from server
			const tokenFormData = new FormData();
			tokenFormData.append("intent", "generate-upload-token");
			tokenFormData.append("title", metadata.title);

			const tokenResponse = await fetch("/resource/videos", {
				method: "POST",
				body: tokenFormData,
			});

			const tokenData = await tokenResponse.json();

			if (!tokenData.success || !tokenData.uploadUrl) {
				throw new Error(tokenData.message || "Failed to get upload token");
			}

			// Step 2: Determine upload method and upload video
			const uploadMethod = getUploadMethod(videoFile.size);
			const fileSize = videoFile.size;

			// Show file size warning for large files
			if (fileSize > 1024 * 1024 * 1024) {
				// > 1GB
				toast.info(
					`Large file detected (${formatBytes(fileSize)}). Using ${uploadMethod} upload for optimal performance.`,
				);
			}

			const confirmUpload = async () => {
				// Step 3: Confirm upload and save metadata
				const confirmFormData = new FormData();
				confirmFormData.append("intent", "confirm-upload");
				confirmFormData.append("videoId", tokenData.videoId);
				confirmFormData.append("videoGuid", tokenData.videoGuid);
				confirmFormData.append("title", metadata.title);
				confirmFormData.append("description", metadata.description || "");
				confirmFormData.append("tags", metadata.tags.join(",") || "");
				confirmFormData.append("fileSize", videoFile.size.toString());

				const confirmResponse = await fetch("/resource/videos", {
					method: "POST",
					body: confirmFormData,
				});

				const confirmData = await confirmResponse.json();

				if (confirmData.success) {
					toast.success(`${metadata.title} uploaded successfully!`);

					// Cleanup uploader
					setActiveUploaders((prev) => ({ ...prev, [file.id]: null }));

					// Optimistic UI update - immediately mark as uploaded
					setUploadedVideos((prev) => new Set(prev).add(file.id));

					// Remove file after a short delay for smooth transition
					setTimeout(() => {
						removeFile(file.id);
						setUploadProgress((prev) => {
							const newProgress = { ...prev };
							delete newProgress[file.id];
							return newProgress;
						});
						setUploadSpeed((prev) => {
							const newSpeed = { ...prev };
							delete newSpeed[file.id];
							return newSpeed;
						});

						// Check if all files are uploaded
						const remainingFiles = files.filter((f) => f.id !== file.id);
						if (remainingFiles.length === 0 && onUploadComplete) {
							onUploadComplete();
						}
					}, 300);
				} else {
					throw new Error(confirmData.message || "Failed to confirm upload");
				}
			};

			if (uploadMethod === "chunked") {
				// Use streaming upload for large files
				const streamingUploader = new StreamingUploader({
					file: videoFile,
					uploadUrl: tokenData.uploadUrl,
					accessKey: tokenData.accessKey,
					onProgress: (progress) => {
						setUploadProgress((prev) => ({
							...prev,
							[file.id]: progress,
						}));
					},
					onSpeedUpdate: (bytesPerSecond) => {
						setUploadSpeed((prev) => ({
							...prev,
							[file.id]: bytesPerSecond,
						}));
					},
					onSuccess: confirmUpload,
					onError: (error) => {
						throw error;
					},
				});

				setActiveUploaders((prev) => ({
					...prev,
					[file.id]: streamingUploader,
				}));
				await streamingUploader.upload();
			} else {
				// Use direct upload for smaller files
				const xhr = new XMLHttpRequest();

				xhr.upload.addEventListener("progress", (event) => {
					if (event.lengthComputable) {
						const progress = Math.round((event.loaded / event.total) * 100);
						setUploadProgress((prev) => ({
							...prev,
							[file.id]: progress,
						}));
					}
				});

				xhr.addEventListener("load", async () => {
					if (xhr.status >= 200 && xhr.status < 300) {
						await confirmUpload();
					} else {
						throw new Error(`Upload failed: HTTP ${xhr.status}`);
					}
				});

				xhr.addEventListener("error", () => {
					throw new Error("Network error during upload");
				});

				xhr.open("PUT", tokenData.uploadUrl);
				xhr.setRequestHeader("AccessKey", tokenData.accessKey);
				xhr.setRequestHeader("Content-Type", videoFile.type);
				xhr.send(videoFile);
			}
		} catch (error) {
			console.error("Upload error:", error);
			toast.error(error instanceof Error ? error.message : "Upload failed");
			setUploadProgress((prev) => {
				const newProgress = { ...prev };
				delete newProgress[file.id];
				return newProgress;
			});
			setUploadSpeed((prev) => {
				const newSpeed = { ...prev };
				delete newSpeed[file.id];
				return newSpeed;
			});
			setActiveUploaders((prev) => ({ ...prev, [file.id]: null }));
		}
	};

	const handleUploadAll = () => {
		files.forEach((file) => {
			if (!uploadProgress[file.id] && !uploadedVideos.has(file.id)) {
				uploadVideo(file);
			}
		});
	};

	// Pause/Resume functions
	const pauseUpload = (fileId: string) => {
		const uploader = activeUploaders[fileId];
		if (uploader) {
			if ("pause" in uploader) {
				uploader.pause();
				setPausedUploads((prev) => new Set(prev).add(fileId));
			}
		}
	};

	const resumeUpload = (fileId: string) => {
		const uploader = activeUploaders[fileId];
		if (uploader) {
			if ("resume" in uploader) {
				uploader.resume();
				setPausedUploads((prev) => {
					const newSet = new Set(prev);
					newSet.delete(fileId);
					return newSet;
				});
			}
		}
	};

	const cancelUpload = (fileId: string) => {
		const uploader = activeUploaders[fileId];
		if (uploader) {
			if ("abort" in uploader) {
				uploader.abort();
			}
		}
		// Clean up all related state
		setActiveUploaders((prev) => ({ ...prev, [fileId]: null }));
		setUploadProgress((prev) => {
			const newProgress = { ...prev };
			delete newProgress[fileId];
			return newProgress;
		});
		setUploadSpeed((prev) => {
			const newSpeed = { ...prev };
			delete newSpeed[fileId];
			return newSpeed;
		});
		setPausedUploads((prev) => {
			const newSet = new Set(prev);
			newSet.delete(fileId);
			return newSet;
		});
	};

	const handleRemoveFile = (fileId: string) => {
		// Cancel any active upload
		cancelUpload(fileId);

		// Remove file from the list
		removeFile(fileId);
		setVideoMetadata((prev) => {
			const newMetadata = { ...prev };
			delete newMetadata[fileId];
			return newMetadata;
		});
		setUploadedVideos((prev) => {
			const newSet = new Set(prev);
			newSet.delete(fileId);
			return newSet;
		});
	};

	const handleClearAll = () => {
		// Cancel all active uploads
		Object.keys(activeUploaders).forEach((fileId) => {
			if (activeUploaders[fileId]) {
				cancelUpload(fileId);
			}
		});

		clearFiles();
		setVideoMetadata({});
		setUploadProgress({});
		setUploadSpeed({});
		setActiveUploaders({});
		setTagInputs({});
		setUploadedVideos(new Set());
		setPausedUploads(new Set());
	};

	return (
		<div className="flex flex-col gap-6 border rounded-lg p-6 bg-card">
			{/* Header */}
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold">Upload New Videos</h3>
				<div className="flex gap-2">
					{files.length > 0 && (
						<>
							<Button variant="outline" size="sm" onClick={handleClearAll}>
								<Trash2
									className="-ms-0.5 size-3.5 opacity-60"
									aria-hidden="true"
								/>
								Clear All
							</Button>
							<Button size="sm" onClick={handleUploadAll}>
								Upload All (
								{files.filter((f) => !uploadedVideos.has(f.id)).length})
							</Button>
						</>
					)}
					{onCancel && (
						<Button variant="ghost" size="sm" onClick={onCancel}>
							<X className="h-4 w-4" />
							Done
						</Button>
					)}
				</div>
			</div>

			{/* Drop area */}
			<div
				onDragEnter={handleDragEnter}
				onDragLeave={handleDragLeave}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
				data-dragging={isDragging || undefined}
				data-files={files.length > 0 || undefined}
				className="border-input data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 relative flex min-h-52 flex-col items-center overflow-hidden rounded-xl border border-dashed p-4 transition-colors not-data-[files]:justify-center has-[input:focus]:ring-[3px]"
			>
				<input
					{...getInputProps()}
					className="sr-only"
					aria-label="Upload video files"
				/>
				{files.length === 0 ? (
					<div className="flex flex-1 flex-col items-center justify-center px-4 py-3 text-center w-full h-full">
						<div
							className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border mx-auto"
							aria-hidden="true"
						>
							<Video className="size-4 opacity-60" />
						</div>
						<p className="mb-1.5 text-sm font-medium w-full text-center">
							Drop your videos here
						</p>
						<p className="text-xs text-muted-foreground mb-1 w-full text-center">
							<span className="font-medium text-primary">
								Drag and drop video here
							</span>{" "}
							or use the button below
						</p>
						<p className="text-muted-foreground text-xs w-full text-center mb-4">
							Max {maxFiles} videos • Up to {maxSizeMB}MB each
						</p>
						<Button variant="outline" onClick={openFileDialog}>
							<Upload className="-ms-1 opacity-60" aria-hidden="true" />
							Select videos
						</Button>
					</div>
				) : (
					<div className="w-full">
						<div className="flex items-center justify-between gap-2 mb-4">
							<h3 className="truncate text-sm font-medium">
								Videos ({files.length})
							</h3>
							<Button variant="outline" size="sm" onClick={openFileDialog}>
								<Upload
									className="-ms-0.5 size-3.5 opacity-60"
									aria-hidden="true"
								/>
								Add more
							</Button>
						</div>
					</div>
				)}
			</div>

			{/* Video cards grid */}
			{files.length > 0 && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{files.map((file) => {
						const progress = uploadProgress[file.id];
						const isUploading = progress !== undefined && progress < 100;
						const isUploaded = uploadedVideos.has(file.id);
						const metadata = videoMetadata[file.id] || {
							title: "",
							description: "",
							tags: [],
						};

						if (isUploaded) {
							return (
								<div
									key={file.id}
									className="bg-background relative flex flex-col rounded-md border opacity-50 transition-opacity"
								>
									{getFilePreview(file)}
									<div className="flex flex-col gap-3 border-t p-4">
										<div className="flex items-center justify-center text-green-500">
											<CheckCircle className="h-5 w-5 mr-2" />
											<span className="text-sm font-medium">Uploaded</span>
										</div>
									</div>
								</div>
							);
						}

						return (
							<div
								key={file.id}
								className="bg-background relative flex flex-col rounded-md border"
							>
								{getFilePreview(file)}
								{!isUploading && (
									<Button
										onClick={() => handleRemoveFile(file.id)}
										size="icon"
										className="border-background focus-visible:border-background absolute -top-2 -right-2 size-6 rounded-full border-2 shadow-none"
										aria-label="Remove video"
									>
										<X className="size-3.5" />
									</Button>
								)}

								<div className="flex flex-col gap-3 border-t p-4">
									{/* File info */}
									<div className="flex items-center gap-2">
										{getFileIcon(file)}
										<div className="flex-1 min-w-0">
											<p className="truncate text-xs font-medium">
												{file.file instanceof File
													? file.file.name
													: file.file.name}
											</p>
											<p className="text-muted-foreground text-xs">
												{formatBytes(
													file.file instanceof File
														? file.file.size
														: file.file.size,
												)}
											</p>
										</div>
									</div>

									{/* Metadata form */}
									<div className="space-y-3">
										<div>
											<Label htmlFor={`title-${file.id}`} className="text-xs">
												Title
											</Label>
											<Input
												id={`title-${file.id}`}
												value={metadata.title}
												onChange={(e) =>
													handleMetadataChange(file.id, "title", e.target.value)
												}
												placeholder="Video title"
												className="h-8 text-sm"
												disabled={isUploading}
											/>
										</div>

										<div>
											<Label htmlFor={`desc-${file.id}`} className="text-xs">
												Description
											</Label>
											<Textarea
												id={`desc-${file.id}`}
												value={metadata.description}
												onChange={(e) =>
													handleMetadataChange(
														file.id,
														"description",
														e.target.value,
													)
												}
												placeholder="Video description (optional)"
												className="min-h-[60px] text-sm"
												disabled={isUploading}
											/>
										</div>

										<div>
											<Label htmlFor={`tags-${file.id}`} className="text-xs">
												Tags
											</Label>
											<Input
												id={`tags-${file.id}`}
												value={tagInputs[file.id] || ""}
												onChange={(e) =>
													setTagInputs((prev) => ({
														...prev,
														[file.id]: e.target.value,
													}))
												}
												onKeyDown={(e) => handleAddTag(file.id, e)}
												placeholder="Type a tag and press Enter"
												className="h-8 text-sm"
												disabled={isUploading}
											/>
											{metadata.tags.length > 0 && (
												<div className="flex flex-wrap gap-1 mt-2">
													{metadata.tags.map((tag) => (
														<Badge
															key={tag}
															variant="secondary"
															className="text-xs cursor-pointer"
															onClick={() =>
																!isUploading && removeTag(file.id, tag)
															}
														>
															{tag}
															<X className="ml-1 h-2.5 w-2.5" />
														</Badge>
													))}
												</div>
											)}
										</div>
									</div>

									{/* Upload progress */}
									{isUploading && (
										<div className="space-y-2">
											<div className="flex justify-between items-center text-xs">
												<span className="flex items-center gap-2">
													{pausedUploads.has(file.id)
														? "Paused"
														: "Uploading..."}
													{/* Upload method indicator */}
													{file.file instanceof File && (
														<span className="text-muted-foreground">
															({getUploadMethod(file.file.size)})
														</span>
													)}
												</span>
												<span>{progress}%</span>
											</div>
											<Progress value={progress} className="h-2" />

											{/* Speed and time remaining */}
											{uploadSpeed[file.id] && !pausedUploads.has(file.id) && (
												<div className="flex justify-between text-xs text-muted-foreground">
													<span>{formatUploadSpeed(uploadSpeed[file.id])}</span>
													<span>
														{formatTimeRemaining(
															file.file instanceof File
																? file.file.size -
																		(file.file.size * progress) / 100
																: 0,
															uploadSpeed[file.id],
														)}
													</span>
												</div>
											)}

											{/* Pause/Resume/Cancel buttons */}
											<div className="flex gap-2">
												{!pausedUploads.has(file.id) ? (
													<Button
														size="sm"
														variant="outline"
														onClick={() => pauseUpload(file.id)}
														className="flex-1"
													>
														<Pause className="h-3 w-3 mr-1" />
														Pause
													</Button>
												) : (
													<Button
														size="sm"
														variant="outline"
														onClick={() => resumeUpload(file.id)}
														className="flex-1"
													>
														<Play className="h-3 w-3 mr-1" />
														Resume
													</Button>
												)}
												<Button
													size="sm"
													variant="destructive"
													onClick={() => cancelUpload(file.id)}
													className="flex-1"
												>
													<Square className="h-3 w-3 mr-1" />
													Cancel
												</Button>
											</div>
										</div>
									)}

									{/* Individual upload button */}
									{!isUploading && (
										<Button
											size="sm"
											onClick={() => uploadVideo(file)}
											className="w-full"
										>
											Upload
										</Button>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}

			{errors.length > 0 && (
				<div
					className="text-destructive flex items-center gap-1 text-xs"
					role="alert"
				>
					<AlertCircle className="size-3 shrink-0" />
					<span>{errors[0]}</span>
				</div>
			)}
		</div>
	);
}
