import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Video } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { redirect, useFetcher, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import PrimaryButton from "~/components/global/brand/primary-button";
import { VideoLibrarySelector } from "~/components/features/videos/video-library-selector";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import {
	ACCEPTED_VIDEO_TYPES,
	MAX_ATTACHMENT_SIZE,
	MAX_VIDEO_SIZE,
} from "~/lib/constants";
import type { FetcherResponse } from "~/lib/types";
import { uploadWithProgress } from "~/lib/utils";
import {
	createSegmentSchema,
	type CreateSegmentSchema,
} from "~/lib/zod-schemas/segment";

type CreateSegmentFetcherResponse = FetcherResponse & {
	segmentSlug: string;
};

type VideoMode = "upload" | "library";

type SelectedVideo = {
	id: string;
	title: string;
	description?: string | null;
	videoGuid: string;
	thumbnailUrl?: string | null;
	duration?: number | null;
	tags?: string | null;
	uploadedBy?: string | null;
	libraryId: string;
	fileSize?: number | null;
	resolution?: string | null;
	status: string;
	createdAt: Date | string;
	updatedAt: Date | string;
};

// Extended schema to handle both modes
const extendedCreateSegmentSchema = createSegmentSchema.extend({
	videoId: z.string().optional(),
	videoFile: z.instanceof(File).optional(),
}).refine(
	(data) => {
		return data.videoFile || data.videoId;
	},
	{
		message: "Either video file or video from library is required",
		path: ["videoFile"],
	},
);

type ExtendedCreateSegmentSchema = z.infer<typeof extendedCreateSegmentSchema>;

const ACCEPTED_FILE_TYPES = {
	"application/pdf": [".pdf"],
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
		".docx",
	],
	"application/msword": [".doc"],
	"image/png": [".png"],
	"image/jpg": [".jpg"],
	"image/jpeg": [".jpeg"],
};

export function CreateSegment() {
	const params = useParams();
	const courseSlug = params.slug;
	const moduleSlug = params.moduleSlug;

	if (!courseSlug) throw redirect("/dashboard/courses");
	if (!moduleSlug) throw redirect(`/dashboard/courses/${courseSlug}`);

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [attachments, setAttachments] = useState<File[]>([]);
	const [videoPreview, setVideoPreview] = useState<string | null>(null);
	const [uploadProgress, setUploadProgress] = useState<{
		video: number;
		attachments: { [key: string]: number };
	}>({ video: 0, attachments: {} });
	const [isUploading, setIsUploading] = useState(false);
	const [videoMode, setVideoMode] = useState<VideoMode>("upload");
	const [selectedVideo, setSelectedVideo] = useState<any>(null);

	const fetcher = useFetcher<CreateSegmentFetcherResponse>();
	const isSubmitting = fetcher.state === "submitting" || isUploading;
	const navigate = useNavigate();
	const form = useForm<ExtendedCreateSegmentSchema>({
		resolver: zodResolver(extendedCreateSegmentSchema),
		defaultValues: {
			name: "",
			description: "",
			videoFile: undefined,
			videoId: undefined,
			courseSlug: courseSlug || "",
			moduleSlug: moduleSlug || "",
			attachments: [],
		},
	});

	const onVideoDropRef = useCallback(
		(acceptedFiles: File[]) => {
			if (acceptedFiles[0]) {
				const file = acceptedFiles[0];
				const reader = new FileReader();
				reader.onload = () => setVideoPreview(reader.result as string);
				reader.readAsDataURL(file);
				form.setValue("videoFile", file);
				form.clearErrors("videoFile");
			}
		},
		[form],
	);

	const onAttachmentDrop = useCallback(
		(acceptedFiles: File[]) => {
			const newAttachments = [...attachments, ...acceptedFiles];
			setAttachments(newAttachments);
			form.setValue("attachments", newAttachments);
		},
		[attachments, form],
	);

	const {
		getRootProps: getVideoRootProps,
		getInputProps: getVideoInputProps,
		isDragActive: isVideoDragActive,
		fileRejections: videoFileRejections,
	} = useDropzone({
		onDrop: onVideoDropRef,
		maxFiles: 1,
		maxSize: MAX_VIDEO_SIZE,
		accept: ACCEPTED_VIDEO_TYPES,
	});

	const { getRootProps, getInputProps, isDragActive, fileRejections } =
		useDropzone({
			onDrop: onAttachmentDrop,
			maxSize: MAX_ATTACHMENT_SIZE,
			accept: ACCEPTED_FILE_TYPES,
			multiple: true,
		});

	const removeAttachment = (index: number) => {
		const newAttachments = attachments.filter((_, i) => i !== index);
		setAttachments(newAttachments);
		form.setValue("attachments", newAttachments);
	};

	const handleVideoSelect = (video: any) => {
		setSelectedVideo(video);
		form.setValue("videoId", video.id);
		form.clearErrors("videoFile");
	};

	const handleChangeSelection = () => {
		setSelectedVideo(null);
		form.setValue("videoId", undefined);
	};

	const handleModeChange = (mode: VideoMode) => {
		setVideoMode(mode);
		// Clear the other mode's value
		if (mode === "upload") {
			setSelectedVideo(null);
			form.setValue("videoId", undefined);
		} else {
			setVideoPreview(null);
			form.setValue("videoFile", undefined);
		}
		form.clearErrors("videoFile");
	};

	const handleDirectUpload = async (data: ExtendedCreateSegmentSchema) => {
		setIsUploading(true);

		try {
			let videoGuid: string;
			let videoId: string | undefined;
			let attachmentData: Array<{
				fileName: string;
				fileUrl: string;
				fileExtension: string;
			}> = [];

			// Handle video and attachments based on mode
			if (videoMode === "library" && selectedVideo) {
				// Use selected video from library
				videoGuid = selectedVideo.videoGuid;
				videoId = selectedVideo.id;

				// Handle attachments for library mode
				if (attachments.length > 0) {
					// Generate tokens just for attachments
					const tokenFormData = new FormData();
					tokenFormData.append("intent", "generate-attachment-tokens");
					tokenFormData.append("name", data.name);

					// Add attachment file names for token generation
					for (const file of attachments) {
						tokenFormData.append("attachmentNames", file.name);
					}

					const tokenResponse = await fetch("/resource/segment", {
						method: "POST",
						body: tokenFormData,
					});

					const attachmentTokens = await tokenResponse.json();

					if (!attachmentTokens.success) {
						throw new Error(attachmentTokens.message || "Failed to generate attachment tokens");
					}

					// Upload attachments
					for (let i = 0; i < attachments.length; i++) {
						const file = attachments[i];
						const token = attachmentTokens.attachmentTokens[i];

						const attachmentSuccess = await uploadWithProgress(
							token.uploadUrl,
							file,
							{
								headers: {
									AccessKey: token.accessKey,
									"Content-Type": "application/octet-stream",
								},
							},
							(progress) =>
								setUploadProgress((prev) => ({
									...prev,
									attachments: { ...prev.attachments, [file.name]: progress },
								})),
						);

						if (attachmentSuccess) {
							attachmentData.push({
								fileName: token.fileName,
								fileUrl: token.cdnUrl,
								fileExtension: token.fileExtension,
							});
						}
					}
				}
			} else if (videoMode === "upload" && data.videoFile) {
				// Step 1: Generate upload tokens for new video and attachments
				const tokenFormData = new FormData();
				tokenFormData.append("intent", "generate-upload-tokens");
				tokenFormData.append("name", data.name);
				tokenFormData.append("lessonId", "temp"); // Will be replaced with actual ID

				// Add attachment file names for token generation
				for (const file of attachments) {
					tokenFormData.append("attachmentNames", file.name);
				}

				const tokenResponse = await fetch("/resource/segment", {
					method: "POST",
					body: tokenFormData,
				});

				const tokens = await tokenResponse.json();

				if (!tokens.success) {
					throw new Error(tokens.message || "Failed to generate upload tokens");
				}

				// Step 2: Upload video directly to Bunny
				const videoSuccess = await uploadWithProgress(
					tokens.videoToken.uploadUrl,
					data.videoFile,
					{
						headers: {
							AccessKey: tokens.videoToken.accessKey,
							"Content-Type": data.videoFile.type,
						},
					},
					(progress) =>
						setUploadProgress((prev) => ({ ...prev, video: progress })),
				);

				if (!videoSuccess) {
					throw new Error("Failed to upload video");
				}

				videoGuid = tokens.videoToken.videoGuid;

				// Step 3: Upload attachments if any exist
				if (attachments.length > 0 && tokens.attachmentTokens) {
					for (let i = 0; i < attachments.length; i++) {
						const file = attachments[i];
						const token = tokens.attachmentTokens[i];

						const attachmentSuccess = await uploadWithProgress(
							token.uploadUrl,
							file,
							{
								headers: {
									AccessKey: token.accessKey,
									"Content-Type": "application/octet-stream",
								},
							},
							(progress) =>
								setUploadProgress((prev) => ({
									...prev,
									attachments: { ...prev.attachments, [file.name]: progress },
								})),
						);

						if (attachmentSuccess) {
							attachmentData.push({
								fileName: token.fileName,
								fileUrl: token.cdnUrl,
								fileExtension: token.fileExtension,
							});
						}
					}
				}
			} else {
				throw new Error("No video selected or uploaded");
			}

			// Step 4: Confirm uploads and create lesson record
			const confirmFormData = new FormData();
			confirmFormData.append("intent", "confirm-uploads");
			confirmFormData.append("videoGuid", videoGuid);
			confirmFormData.append("name", data.name);
			confirmFormData.append("description", data.description);
			confirmFormData.append("courseSlug", data.courseSlug);
			confirmFormData.append("moduleSlug", data.moduleSlug);

			// Add video ID if using library video
			if (videoId) {
				confirmFormData.append("videoId", videoId);
			}

			if (attachmentData.length > 0) {
				confirmFormData.append(
					"attachmentData",
					JSON.stringify(attachmentData),
				);
			}

			fetcher.submit(confirmFormData, {
				method: "POST",
				action: "/resource/segment",
			});
		} catch (error) {
			console.error("Upload error:", error);
			toast.error(error instanceof Error ? error.message : "Upload failed");
			setIsUploading(false);
		}
	};

	useEffect(() => {
		if (fetcher.data) {
			// Reset upload state
			setIsUploading(false);
			setUploadProgress({ video: 0, attachments: {} });
		}
	}, [fetcher.data]);

	return (
		<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<DialogTrigger asChild>
				<PrimaryButton>Add Lesson</PrimaryButton>
			</DialogTrigger>
			<DialogContent className="flex flex-col gap-8 max-w-3xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Create Lesson</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form
						className="flex flex-col gap-4"
						onSubmit={form.handleSubmit(handleDirectUpload)}
					>
						<FormField
							control={form.control}
							name="name"
							disabled={isSubmitting}
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Name <span className="text-xs text-red-500">*</span>
									</FormLabel>
									<FormControl>
										<Input
											placeholder="Enter lesson name"
											type="text"
											className="bg-white text-black focus-visible:ring-0 focus-visible:ring-offset-0"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="description"
							disabled={isSubmitting}
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Description <span className="text-xs text-red-500">*</span>
									</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Enter lesson description"
											className="bg-white text-black focus-visible:ring-0 focus-visible:ring-offset-0"
											maxLength={255}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="videoFile"
							disabled={isSubmitting}
							render={() => (
								<FormItem>
									<FormLabel
										className={`${
											videoFileRejections.length !== 0 && "text-destructive"
										}`}
									>
										Video <span className="text-xs text-red-500">*</span>
									</FormLabel>
									<FormControl>
										<Tabs
											value={videoMode}
											onValueChange={(value) => handleModeChange(value as VideoMode)}
											className="w-full"
										>
											<TabsList className="grid w-full grid-cols-2">
												<TabsTrigger value="upload">Upload New Video</TabsTrigger>
												<TabsTrigger value="library">Select from Library</TabsTrigger>
											</TabsList>

											<TabsContent value="upload" className="mt-4">
												<div
													{...getVideoRootProps()}
													className="flex cursor-pointer flex-col items-center justify-center gap-y-2 rounded-lg border-2 border-dashed border-gray-300 p-6 transition-colors hover:border-gray-400"
												>
													{videoPreview ? (
														<video
															aria-label="Video Preview"
															src={videoPreview}
															controls
															className="max-h-[200px] rounded-lg object-cover"
														/>
													) : (
														<Video className="size-12 text-gray-400" />
													)}
													<input
														{...getVideoInputProps()}
														type="file"
														className="hidden"
													/>
													{isVideoDragActive ? (
														<p className="text-sm text-gray-600">Drop the video!</p>
													) : (
														<p className="text-sm text-gray-600">
															Click here or drag a video file to upload
															<br />
															<span className="text-xs text-gray-500">
																Supports: MP4, AVI, MOV, WMV, WebM, MKV (Max{" "}
																{MAX_VIDEO_SIZE / 1024 / 1024}MB)
															</span>
														</p>
													)}
												</div>
											</TabsContent>

											<TabsContent value="library" className="mt-4">
												{selectedVideo ? (
													<div className="flex flex-col gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
														<div className="flex items-start gap-4">
															{selectedVideo.thumbnailUrl && (
																<img
																	src={selectedVideo.thumbnailUrl}
																	alt={selectedVideo.title}
																	className="w-24 h-16 object-cover rounded"
																/>
															)}
															<div className="flex-1">
																<h4 className="font-medium text-gray-900">
																	Selected: {selectedVideo.title}
																</h4>
																{selectedVideo.duration && (
																	<p className="text-sm text-gray-600">
																		Duration: {Math.floor(selectedVideo.duration / 60)}:
																		{(selectedVideo.duration % 60).toString().padStart(2, "0")}
																	</p>
																)}
															</div>
														</div>
														<Button
															type="button"
															variant="outline"
															size="sm"
															onClick={handleChangeSelection}
															className="self-start"
														>
															Change Selection
														</Button>
													</div>
												) : (
													<VideoLibrarySelector
														onSelectVideo={handleVideoSelect}
														selectedVideoId={selectedVideo?.id as string | undefined}
													/>
												)}
											</TabsContent>
										</Tabs>
									</FormControl>
									<FormMessage>
										{videoFileRejections.length !== 0 && videoMode === "upload" && (
											<p>
												Video must be less than {MAX_VIDEO_SIZE / 1024 / 1024}MB
												and of supported format (MP4, AVI, MOV, WMV, WebM, MKV)
											</p>
										)}
										{form.formState.errors.videoFile && (
											<p className="text-sm text-red-500">
												{form.formState.errors.videoFile.message}
											</p>
										)}
									</FormMessage>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="attachments"
							disabled={isSubmitting}
							render={() => (
								<FormItem>
									<FormLabel
										className={`${
											fileRejections.length !== 0 && "text-destructive"
										}`}
									>
										Lesson Attachments (Optional)
									</FormLabel>
									<FormControl>
										<div
											{...getRootProps()}
											className="flex cursor-pointer flex-col items-center justify-center gap-y-2 rounded-lg border-2 border-dashed border-gray-300 p-6 transition-colors hover:border-gray-400"
										>
											<FileText className="size-8 text-gray-400" />
											<Input
												{...getInputProps()}
												type="file"
												className="hidden"
											/>
											{isDragActive ? (
												<p className="text-sm text-gray-600">
													Drop the files here!
												</p>
											) : (
												<p className="text-sm text-gray-600">
													Click here or drag files to upload
													<br />
													<span className="text-xs text-gray-500">
														Supports: PDF, DOCX, DOC, PNG, JPG, JPEG (Max 10MB
														each)
													</span>
												</p>
											)}
										</div>
									</FormControl>

									{/* Display uploaded files */}
									{attachments.length > 0 && (
										<div className="mt-4 space-y-2">
											<p className="text-sm font-medium">Uploaded Files:</p>
											<div className="flex flex-wrap gap-2">
												{attachments.map((file, index) => (
													<Badge
														key={file.name}
														variant="secondary"
														className="flex items-center gap-2 px-3 py-1 max-w-xs"
													>
														<FileText className="h-3 w-3 flex-shrink-0" />
														<span
															className="text-xs truncate max-w-40"
															title={file.name}
														>
															{file.name}
														</span>
														<button
															type="button"
															onClick={() => removeAttachment(index)}
															className="ml-1 text-red-500 hover:text-red-700 flex-shrink-0"
														>
															×
														</button>
													</Badge>
												))}
											</div>
										</div>
									)}

									<FormMessage>
										{fileRejections.length !== 0 && (
											<p>
												Some files were rejected. Please ensure files are less
												than 10MB and of supported types (PDF, DOCX, DOC, PNG,
												JPG, JPEG)
											</p>
										)}
									</FormMessage>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="courseSlug"
							disabled={isSubmitting}
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<Input hidden {...field} />
									</FormControl>
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="moduleSlug"
							disabled={isSubmitting}
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<Input hidden {...field} />
									</FormControl>
								</FormItem>
							)}
						/>
						{/* Upload Progress Display */}
						{isUploading && (
							<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
								<h3 className="font-medium text-blue-800 mb-3">
									Upload Progress
								</h3>

								{/* Video Upload Progress - only show for upload mode */}
								{videoMode === "upload" && (
									<div className="mb-4">
										<div className="flex justify-between text-sm text-blue-700 mb-1">
											<span>Video Upload</span>
											<span>{uploadProgress.video}%</span>
										</div>
										<div className="w-full bg-blue-200 rounded-full h-2">
											<div
												className="bg-blue-600 h-2 rounded-full transition-all duration-300"
												style={{ width: `${uploadProgress.video}%` }}
											/>
										</div>
									</div>
								)}

								{/* Attachment Upload Progress */}
								{Object.keys(uploadProgress.attachments).length > 0 && (
									<div>
										<h4 className="text-sm font-medium text-blue-700 mb-2">
											Attachments
										</h4>
										{Object.entries(uploadProgress.attachments).map(
											([fileName, progress]) => (
												<div key={fileName} className="mb-2">
													<div className="flex justify-between text-xs text-blue-600 mb-1">
														<span
															className="truncate max-w-40"
															title={fileName}
														>
															{fileName}
														</span>
														<span>{progress}%</span>
													</div>
													<div className="w-full bg-blue-200 rounded-full h-1">
														<div
															className="bg-blue-500 h-1 rounded-full transition-all duration-300"
															style={{ width: `${progress}%` }}
														/>
													</div>
												</div>
											),
										)}
									</div>
								)}
							</div>
						)}

						<div className="flex justify-end">
							<PrimaryButton
								type="submit"
								disabled={isSubmitting}
								className="min-w-32"
							>
								{isSubmitting
									? isUploading
										? "Uploading..."
										: "Creating..."
									: "Create Lesson"}
							</PrimaryButton>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
