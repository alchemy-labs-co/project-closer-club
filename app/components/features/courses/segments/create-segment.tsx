import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Video } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { redirect, useFetcher, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
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
import { Badge } from "~/components/ui/badge";
import {
	MAX_ATTACHMENT_SIZE,
	MAX_VIDEO_SIZE,
	ACCEPTED_VIDEO_TYPES,
} from "~/lib/constants";
import type { FetcherResponse } from "~/lib/types";
import {
	createSegmentSchema,
	type CreateSegmentSchema,
} from "~/lib/zod-schemas/segment";

type CreateSegmentFetcherResponse = FetcherResponse & {
	segmentSlug: string;
};

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
	const fetcher = useFetcher<CreateSegmentFetcherResponse>();
	const isSubmitting = fetcher.state === "submitting";
	const navigate = useNavigate();
	const form = useForm<CreateSegmentSchema>({
		resolver: zodResolver(createSegmentSchema),
		defaultValues: {
			name: "",
			description: "",
			videoFile: new File([""], "filename"),
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
		[form]
	);

	const onAttachmentDrop = useCallback(
		(acceptedFiles: File[]) => {
			const newAttachments = [...attachments, ...acceptedFiles];
			setAttachments(newAttachments);
			form.setValue("attachments", newAttachments);
		},
		[attachments, form]
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

	useEffect(() => {
		if (fetcher.data) {
			if (fetcher.data.success) {
				toast.success(fetcher.data.message);
				if (fetcher.data.segmentSlug) {
					navigate(
						`/dashboard/courses/${courseSlug}/${moduleSlug}/${fetcher.data.segmentSlug}`
					);
				}
			}
			if (!fetcher.data.success) {
				toast.error(fetcher.data.message);
			}
		}
	}, [fetcher.data, courseSlug, moduleSlug, navigate]);

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
					<fetcher.Form
						method="POST"
						action="/resource/segment"
						className="flex flex-col gap-4"
						encType="multipart/form-data"
						onSubmit={form.handleSubmit((data) => {
							const formData = new FormData();
							formData.append("intent", "create-segment");
							formData.append("name", data.name);
							formData.append("description", data.description);
							formData.append("videoFile", data.videoFile);
							formData.append("courseSlug", data.courseSlug);
							formData.append("moduleSlug", data.moduleSlug);

							// Add attachments
							if (data.attachments) {
								data.attachments.forEach((file) => {
									formData.append("attachments", file);
								});
							}

							fetcher.submit(formData, {
								method: "POST",
								action: "/resource/segment",
								encType: "multipart/form-data",
							});
						})}
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
										Video File <span className="text-xs text-red-500">*</span>
									</FormLabel>
									<FormControl>
										<div
											{...getVideoRootProps()}
											className="flex cursor-pointer flex-col items-center justify-center gap-y-2 rounded-lg border-2 border-dashed border-gray-300 p-6 transition-colors hover:border-gray-400"
										>
											{videoPreview ? (
												<video
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
									</FormControl>
									<FormMessage>
										{videoFileRejections.length !== 0 && (
											<p>
												Video must be less than {MAX_VIDEO_SIZE / 1024 / 1024}MB
												and of supported format (MP4, AVI, MOV, WMV, WebM, MKV)
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
														key={index}
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
						<PrimaryButton type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Creating Lesson..." : "Create Lesson"}
						</PrimaryButton>
					</fetcher.Form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
