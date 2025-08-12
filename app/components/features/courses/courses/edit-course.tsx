import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Pencil } from "lucide-react";
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
import { MAX_THUMBNAIL_SIZE } from "~/lib/constants";
import type { FetcherResponse } from "~/lib/types";
import {
	type UpdateCourseSchema,
	updateCourseSchema,
} from "~/lib/zod-schemas/course";
export function EditCourse({
	name,
	description,
	courseId,
	slug,
	thumbnailUrl,
}: {
	name: string;
	description: string;
	courseId: string;
	slug: string;
	thumbnailUrl?: string;
}) {
	const [preview, setPreview] = useState<string | ArrayBuffer | null>(
		thumbnailUrl || null,
	);

	const fetcher = useFetcher<FetcherResponse>();
	const isSubmitting = fetcher.state === "submitting";

	const form = useForm<UpdateCourseSchema>({
		resolver: zodResolver(updateCourseSchema),
		defaultValues: {
			name: name,
			description: description,
			thumbnail: undefined,
		},
	});

	const onDrop = useCallback(
		(acceptedFiles: File[]) => {
			const reader = new FileReader();
			try {
				reader.onload = () => setPreview(reader.result as string);
				reader.readAsDataURL(acceptedFiles[0]);
				form.setValue("thumbnail", acceptedFiles[0]);
				form.clearErrors("thumbnail");
			} catch (error) {
				setPreview(thumbnailUrl || null);
				form.resetField("thumbnail");
			}
		},
		[form, thumbnailUrl],
	);

	const { getRootProps, getInputProps, isDragActive, fileRejections } =
		useDropzone({
			onDrop,
			maxFiles: 1,
			maxSize: MAX_THUMBNAIL_SIZE,
			accept: { "image/png": [], "image/jpg": [], "image/jpeg": [] },
		});

	return (
		<Dialog>
			<DialogTrigger asChild>
				<div className="w-6 h-6 flex items-center cursor-pointer justify-center rounded-full bg-gray-200">
					<Pencil className="w-4 h-4 text-gray-500  hover:text-gray-700" />
				</div>
			</DialogTrigger>
			<DialogContent className="flex flex-col gap-8 max-w-2xl">
				<DialogHeader>
					<DialogTitle>Edit Course</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<fetcher.Form
						method="POST"
						action="/resource/course"
						className="flex flex-col gap-4"
						encType="multipart/form-data"
						onSubmit={form.handleSubmit((data) => {
							const formData = new FormData();
							formData.append("intent", "edit-course");
							formData.append("id", courseId);
							formData.append("slug", slug);
							formData.append("name", data.name);
							formData.append("description", data.description);
							if (data.thumbnail && data.thumbnail.size > 0) {
								formData.append("thumbnail", data.thumbnail);
							} else if (thumbnailUrl) {
								formData.append("thumbnail", "");
							}

							fetcher.submit(formData, {
								method: "POST",
								action: "/resource/course",
								encType: "multipart/form-data",
							});
						})}
					>
						<FormField
							control={form.control}
							name="thumbnail"
							disabled={isSubmitting}
							render={() => (
								<FormItem>
									<FormLabel
										className={`${
											fileRejections.length !== 0 && "text-destructive"
										}`}
									>
										Course Thumbnail
									</FormLabel>
									<FormControl>
										<div
											{...getRootProps()}
											className="flex cursor-pointer flex-col items-center justify-center gap-y-2 rounded-lg border-2 border-dashed border-gray-300 p-6 transition-colors hover:border-gray-400"
										>
											{preview && (
												<img
													src={preview as string}
													alt="Course thumbnail preview"
													className="max-h-[200px] rounded-lg object-cover"
												/>
											)}
											<ImagePlus
												className={`size-12 text-gray-400 ${
													preview ? "hidden" : "block"
												}`}
											/>
											<Input
												{...getInputProps()}
												type="file"
												className="hidden"
											/>
											{isDragActive ? (
												<p className="text-sm text-gray-600">Drop the image!</p>
											) : (
												<p className="text-sm text-gray-600">
													{preview
														? "Click here or drag an image to change thumbnail"
														: "Click here or drag an image to upload"}
												</p>
											)}
										</div>
									</FormControl>
									<FormMessage>
										{fileRejections.length !== 0 && (
											<p>
												Image must be less than {MAX_THUMBNAIL_SIZE / 1000000}MB
												and of type png, jpg, or jpeg
											</p>
										)}
									</FormMessage>
								</FormItem>
							)}
						/>

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
											placeholder="Enter course name"
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
											placeholder="Enter course description"
											className="bg-white text-black focus-visible:ring-0 focus-visible:ring-offset-0"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Submit button */}
						<PrimaryButton type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Editing Course..." : "Edit Course"}
						</PrimaryButton>
					</fetcher.Form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
