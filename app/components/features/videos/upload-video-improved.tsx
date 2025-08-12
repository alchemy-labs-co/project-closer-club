import {
	AlertCircle,
	Trash2,
	Upload,
	Video,
	X,
	FileVideo,
	Film,
} from "lucide-react";
import { useState } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import PrimaryButton from "~/components/global/brand/primary-button";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Progress } from "~/components/ui/progress";
import {
	useFileUpload,
	formatBytes,
	type FileWithPreview,
} from "~/hooks/use-file-upload";
import { MAX_VIDEO_SIZE, ACCEPTED_VIDEO_TYPES } from "~/lib/constants";
import type { FetcherResponse } from "~/lib/types";

type UploadVideoFetcherResponse = FetcherResponse & {
	videoId?: string;
	uploadUrl?: string;
	accessKey?: string;
	videoGuid?: string;
};

type UploadProgress = {
	[fileId: string]: number;
};

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

export function UploadVideoImproved() {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
	const [videoMetadata, setVideoMetadata] = useState<{
		[fileId: string]: {
			title: string;
			description: string;
			tags: string[];
		};
	}>({});
	const [tagInputs, setTagInputs] = useState<{ [fileId: string]: string }>({});

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

			// Step 2: Upload video directly to Bunny Stream with progress tracking
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
						removeFile(file.id);
						setUploadProgress((prev) => {
							const newProgress = { ...prev };
							delete newProgress[file.id];
							return newProgress;
						});
					} else {
						throw new Error(confirmData.message || "Failed to confirm upload");
					}
				} else {
					throw new Error("Upload failed");
				}
			});

			xhr.addEventListener("error", () => {
				toast.error(`Failed to upload ${metadata.title}`);
				setUploadProgress((prev) => {
					const newProgress = { ...prev };
					delete newProgress[file.id];
					return newProgress;
				});
			});

			xhr.open("PUT", tokenData.uploadUrl);
			xhr.setRequestHeader("AccessKey", tokenData.accessKey);
			xhr.setRequestHeader("Content-Type", videoFile.type);
			xhr.send(videoFile);
		} catch (error) {
			console.error("Upload error:", error);
			toast.error(error instanceof Error ? error.message : "Upload failed");
			setUploadProgress((prev) => {
				const newProgress = { ...prev };
				delete newProgress[file.id];
				return newProgress;
			});
		}
	};

	const handleUploadAll = () => {
		files.forEach((file) => {
			if (!uploadProgress[file.id]) {
				uploadVideo(file);
			}
		});
	};

	const handleRemoveFile = (fileId: string) => {
		removeFile(fileId);
		setVideoMetadata((prev) => {
			const newMetadata = { ...prev };
			delete newMetadata[fileId];
			return newMetadata;
		});
		setUploadProgress((prev) => {
			const newProgress = { ...prev };
			delete newProgress[fileId];
			return newProgress;
		});
	};

	const handleClearAll = () => {
		clearFiles();
		setVideoMetadata({});
		setUploadProgress({});
		setTagInputs({});
	};

	return (
		<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<DialogTrigger asChild>
				<PrimaryButton>
					<Upload className="w-4 h-4 mr-2" />
					Upload Videos
				</PrimaryButton>
			</DialogTrigger>
			<DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Upload Videos to Library</DialogTitle>
				</DialogHeader>

				<div className="flex flex-col gap-4">
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
						{files.length > 0 ? (
							<div className="flex w-full flex-col gap-3">
								<div className="flex items-center justify-between gap-2">
									<h3 className="truncate text-sm font-medium">
										Videos ({files.length})
									</h3>
									<div className="flex gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={openFileDialog}
										>
											<Upload
												className="-ms-0.5 size-3.5 opacity-60"
												aria-hidden="true"
											/>
											Add videos
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={handleClearAll}
										>
											<Trash2
												className="-ms-0.5 size-3.5 opacity-60"
												aria-hidden="true"
											/>
											Remove all
										</Button>
										<Button size="sm" onClick={handleUploadAll}>
											Upload All
										</Button>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{files.map((file) => {
										const progress = uploadProgress[file.id];
										const isUploading =
											progress !== undefined && progress < 100;
										const metadata = videoMetadata[file.id] || {
											title: "",
											description: "",
											tags: [],
										};

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
															<Label
																htmlFor={`title-${file.id}`}
																className="text-xs"
															>
																Title
															</Label>
															<Input
																id={`title-${file.id}`}
																value={metadata.title}
																onChange={(e) =>
																	handleMetadataChange(
																		file.id,
																		"title",
																		e.target.value,
																	)
																}
																placeholder="Video title"
																className="h-8 text-sm"
																disabled={isUploading}
															/>
														</div>

														<div>
															<Label
																htmlFor={`desc-${file.id}`}
																className="text-xs"
															>
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
															<Label
																htmlFor={`tags-${file.id}`}
																className="text-xs"
															>
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
														<div className="space-y-1">
															<div className="flex justify-between text-xs">
																<span>Uploading...</span>
																<span>{progress}%</span>
															</div>
															<Progress value={progress} className="h-1.5" />
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
							</div>
						) : (
							<div className="flex flex-col items-center justify-center px-4 py-3 text-center">
								<div
									className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border"
									aria-hidden="true"
								>
									<Video className="size-4 opacity-60" />
								</div>
								<p className="mb-1.5 text-sm font-medium">
									Drop your videos here
								</p>
								<p className="text-muted-foreground text-xs">
									Max {maxFiles} videos • Up to {maxSizeMB}MB each
								</p>
								<Button
									variant="outline"
									className="mt-4"
									onClick={openFileDialog}
								>
									<Upload className="-ms-1 opacity-60" aria-hidden="true" />
									Select videos
								</Button>
							</div>
						)}
					</div>

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
			</DialogContent>
		</Dialog>
	);
}
