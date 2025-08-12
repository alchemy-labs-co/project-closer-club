import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, Video, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { useFetcher } from "react-router";
import PrimaryButton from "~/components/global/brand/primary-button";
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
import { Textarea } from "~/components/ui/textarea";
import { Progress } from "~/components/ui/progress";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { MAX_VIDEO_SIZE, ACCEPTED_VIDEO_TYPES } from "~/lib/constants";
import type { FetcherResponse } from "~/lib/types";
import { formatBytes, uploadWithProgress } from "~/lib/utils";
import {
	uploadVideoSchema,
	type UploadVideoSchema,
} from "~/lib/zod-schemas/video";
import { toast } from "sonner";

type UploadVideoFetcherResponse = FetcherResponse & {
	videoId?: string;
	uploadUrl?: string;
	accessKey?: string;
	videoGuid?: string;
};

export function UploadVideo() {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [videoFile, setVideoFile] = useState<File | null>(null);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [isUploading, setIsUploading] = useState(false);
	const [tags, setTags] = useState<string[]>([]);
	const [tagInput, setTagInput] = useState("");

	const fetcher = useFetcher<UploadVideoFetcherResponse>();
	const isSubmitting = fetcher.state === "submitting" || isUploading;

	const form = useForm<UploadVideoSchema>({
		resolver: zodResolver(uploadVideoSchema),
		defaultValues: {
			title: "",
			description: "",
			tags: "",
			videoFile: new File([""], "filename"),
		},
	});

	// Handle successful form submission
	if (fetcher.data?.success && fetcher.state === "idle" && isDialogOpen) {
		setIsDialogOpen(false);
		form.reset();
		setVideoFile(null);
		setTags([]);
		setUploadProgress(0);
		toast.success("Video uploaded successfully!");
	}

	const onDrop = useCallback(
		(acceptedFiles: File[]) => {
			if (acceptedFiles[0]) {
				const file = acceptedFiles[0];
				setVideoFile(file);
				form.setValue("videoFile", file);
				form.clearErrors("videoFile");

				// Auto-fill title from filename if empty
				if (!form.getValues("title")) {
					const titleFromFile = file.name
						.replace(/\.[^/.]+$/, "") // Remove extension
						.replace(/[-_]/g, " ") // Replace dashes/underscores with spaces
						.replace(/\b\w/g, (l) => l.toUpperCase()); // Capitalize words
					form.setValue("title", titleFromFile);
				}
			}
		},
		[form],
	);

	const { getRootProps, getInputProps, isDragActive, fileRejections } =
		useDropzone({
			onDrop,
			maxFiles: 1,
			maxSize: MAX_VIDEO_SIZE,
			accept: ACCEPTED_VIDEO_TYPES,
		});

	const handleAddTag = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			if (tagInput.trim() && !tags.includes(tagInput.trim())) {
				const newTags = [...tags, tagInput.trim()];
				setTags(newTags);
				form.setValue("tags", newTags.join(","));
				setTagInput("");
			}
		}
	};

	const removeTag = (tagToRemove: string) => {
		const newTags = tags.filter((tag) => tag !== tagToRemove);
		setTags(newTags);
		form.setValue("tags", newTags.join(","));
	};

	const handleUpload = async (data: UploadVideoSchema) => {
		if (!videoFile) {
			toast.error("Please select a video file");
			return;
		}

		setIsUploading(true);

		try {
			// Step 1: Get upload token from server
			const tokenFormData = new FormData();
			tokenFormData.append("intent", "generate-upload-token");
			tokenFormData.append("title", data.title);

			const tokenResponse = await fetch("/resource/videos", {
				method: "POST",
				body: tokenFormData,
			});

			const tokenData = await tokenResponse.json();

			if (!tokenData.success || !tokenData.uploadUrl) {
				throw new Error(tokenData.message || "Failed to get upload token");
			}

			// Step 2: Upload video directly to Bunny Stream with progress tracking
			await uploadWithProgress(
				tokenData.uploadUrl,
				videoFile,
				{
					headers: {
						AccessKey: tokenData.accessKey,
						"Content-Type": videoFile.type,
					},
				},
				(progress) => {
					setUploadProgress(progress);
				},
			);

			// Step 3: Confirm upload and save metadata
			const confirmFormData = new FormData();
			confirmFormData.append("intent", "confirm-upload");
			confirmFormData.append("videoId", tokenData.videoId);
			confirmFormData.append("videoGuid", tokenData.videoGuid);
			confirmFormData.append("title", data.title);
			confirmFormData.append("description", data.description || "");
			confirmFormData.append("tags", data.tags || "");
			confirmFormData.append("fileSize", videoFile.size.toString());

			fetcher.submit(confirmFormData, {
				method: "POST",
				action: "/resource/videos",
			});
		} catch (error) {
			console.error("Upload error:", error);
			toast.error(error instanceof Error ? error.message : "Upload failed");
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<DialogTrigger asChild>
				<PrimaryButton>
					<Upload className="w-4 h-4 mr-2" />
					Upload Video
				</PrimaryButton>
			</DialogTrigger>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Upload Video to Library</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleUpload)}
						className="flex flex-col gap-4"
					>
						{/* Video Upload Area */}
						<FormField
							control={form.control}
							name="videoFile"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Video File</FormLabel>
									<FormControl>
										<div
											{...getRootProps()}
											className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
												isDragActive
													? "border-primary bg-primary/5"
													: "border-gray-300 hover:border-primary"
											}`}
										>
											<input {...getInputProps()} />
											{videoFile ? (
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-3">
														<Video className="h-8 w-8 text-primary" />
														<div className="text-left">
															<p className="font-medium">{videoFile.name}</p>
															<p className="text-sm text-muted-foreground">
																{formatBytes(videoFile.size)}
															</p>
														</div>
													</div>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={(e) => {
															e.stopPropagation();
															setVideoFile(null);
															form.resetField("videoFile");
														}}
													>
														<X className="h-4 w-4" />
													</Button>
												</div>
											) : (
												<div>
													<Upload className="mx-auto h-12 w-12 text-gray-400" />
													<p className="mt-2">
														{isDragActive
															? "Drop the video here"
															: "Drag & drop a video file here, or click to select"}
													</p>
													<p className="mt-1 text-sm text-muted-foreground">
														Maximum file size: {formatBytes(MAX_VIDEO_SIZE)}
													</p>
												</div>
											)}
										</div>
									</FormControl>
									<FormMessage />
									{fileRejections.length > 0 && (
										<p className="text-sm text-red-500 mt-2">
											{fileRejections[0].errors[0].message}
										</p>
									)}
								</FormItem>
							)}
						/>

						{/* Title */}
						<FormField
							control={form.control}
							name="title"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Title</FormLabel>
									<FormControl>
										<Input {...field} placeholder="Enter video title" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Description */}
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description (Optional)</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											placeholder="Enter video description"
											rows={3}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Tags */}
						<FormField
							control={form.control}
							name="tags"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Tags (Optional)</FormLabel>
									<FormControl>
										<div>
											<Input
												value={tagInput}
												onChange={(e) => setTagInput(e.target.value)}
												onKeyDown={handleAddTag}
												placeholder="Type a tag and press Enter"
												disabled={isSubmitting}
											/>
											{tags.length > 0 && (
												<div className="flex flex-wrap gap-2 mt-2">
													{tags.map((tag) => (
														<Badge
															key={tag}
															variant="secondary"
															className="cursor-pointer"
															onClick={() => removeTag(tag)}
														>
															{tag}
															<X className="ml-1 h-3 w-3" />
														</Badge>
													))}
												</div>
											)}
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Upload Progress */}
						{isUploading && (
							<div className="space-y-2">
								<div className="flex justify-between text-sm">
									<span>Uploading...</span>
									<span>{uploadProgress}%</span>
								</div>
								<Progress value={uploadProgress} />
							</div>
						)}

						{/* Submit Button */}
						<div className="flex justify-end gap-3">
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsDialogOpen(false)}
								disabled={isSubmitting}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isSubmitting || !videoFile}>
								{isSubmitting ? "Uploading..." : "Upload Video"}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
