import { zodResolver } from "@hookform/resolvers/zod";
import {
	ArrowRightIcon,
	Download,
	FileText,
	Pencil,
	Plus,
	Trash2,
} from "lucide-react";
import React, { Suspense, useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { href, Link, redirect, useFetcher, useLoaderData } from "react-router";
import { VideoPlayer } from "~/components/features/video-players/video-player";
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
import { Skeleton } from "~/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { dashboardConfig } from "~/config/dashboard";
import type { Attachment, Segment } from "~/db/schema";
import {
	getLessonBySlug,
	getQuizzesForLesson,
	getAttachmentsForLesson,
} from "~/lib/admin/data-access/lessons/lessons.server";
import { isAdminLoggedIn } from "~/lib/auth/auth.server";
import type { FetcherResponse } from "~/lib/types";
import { formatDateToString } from "~/lib/utils";
import {
	ACCEPTED_FILE_TYPES,
	attachmentUploadSchema,
	MAX_FILE_SIZE,
	type AttachmentUploadSchema,
} from "~/lib/zod-schemas/attachment";
import type { Route } from "./+types/_admin._editor.dashboard.courses_.$slug_.$moduleSlug_.$segmentSlug";
import type { Question } from "./_admin.dashboard.quizzes_.create";

import { DROPZONE_ACCEPTED_TYPES } from "~/lib/constants";
import PrimaryButton from "~/components/global/brand/primary-button";

export async function loader({ request, params }: Route.LoaderArgs) {
	// auth check
	const { isLoggedIn } = await isAdminLoggedIn(request);
	if (!isLoggedIn) {
		throw redirect("/admin/login");
	}

	// non critical data

	const { slug: courseSlug, moduleSlug, segmentSlug } = params;

	if (!courseSlug || !moduleSlug || !segmentSlug) {
		throw redirect("/dashboard/courses");
	}

	// non critical data
	const quizzes = getQuizzesForLesson(
		request,
		segmentSlug,
		moduleSlug,
		courseSlug
	);

	const attachments = getAttachmentsForLesson(
		request,
		segmentSlug,
		moduleSlug,
		courseSlug
	);

	// critical data
	const { success, lesson } = await getLessonBySlug(
		request,
		segmentSlug,
		moduleSlug,
		courseSlug
	);

	if (!success || !lesson) {
		throw redirect(`/dashboard/courses/${courseSlug}/${moduleSlug}`);
	}

	return {
		quizzes,
		attachments,
		courseSlug,
		moduleSlug,
		lesson,
	};
}

export default function LessonView({ loaderData }: Route.ComponentProps) {
	const { courseSlug, moduleSlug, lesson } = loaderData;

	return (
		<div className="flex flex-col gap-4 p-4 overflow-y-auto h-full [scrollbar-width:thin]">
			{/* display created at and edit link */}
			<div className="flex items-center justify-between w-full">
				<Button variant={"link"} asChild>
					<Link
						to={href("/dashboard/courses/:slug/:moduleSlug/:segmentSlug/edit", {
							slug: courseSlug,
							moduleSlug: moduleSlug,
							segmentSlug: lesson.slug,
						})}
					>
						Edit <ArrowRightIcon className="w-4 h-4" />
					</Link>
				</Button>
				<p className="text-sm text-gray-500 self-end">
					Created at: {formatDateToString(lesson.created_at)}
				</p>
			</div>

			{/* Video Player */}
			<VideoPlayer type={dashboardConfig.videoPlayer} url={lesson.videoUrl} />

			<Tabs defaultValue="lesson" className="w-full">
				<TabsList className="w-full">
					<TabsTrigger value="lesson">Lesson</TabsTrigger>
					<TabsTrigger value="quizzes">Quizzes</TabsTrigger>
					<TabsTrigger value="attachments">Attachments</TabsTrigger>
				</TabsList>
				<TabsContent value="lesson" className="mt-6">
					<div className="space-y-4">
						<h2 className="text-2xl font-bold text-gray-800">{lesson.name}</h2>

						{lesson.description && (
							<div className="prose prose-gray max-w-none">
								<p className="text-gray-600 leading-relaxed">
									{lesson.description}
								</p>
							</div>
						)}
					</div>
				</TabsContent>
				<TabsContent value="quizzes" className="mt-6">
					<Suspense fallback={<QuizzesSkeleton />}>
						<LessonQuizzes />
					</Suspense>
				</TabsContent>
				<TabsContent value="attachments" className="mt-6">
					<Suspense fallback={<AttachmentsSkeleton />}>
						<LessonAttachments lesson={lesson} />
					</Suspense>
				</TabsContent>
			</Tabs>
			{/* Lesson Details */}
		</div>
	);
}

function LessonQuizzes() {
	const { quizzes } = useLoaderData<typeof loader>();
	const quizzesData = React.use(quizzes);

	if (
		!quizzesData.success ||
		!quizzesData.quizzes ||
		quizzesData.quizzes.length === 0
	) {
		return (
			<div className="space-y-4">
				<h2 className="text-2xl font-bold text-gray-800">Quizzes</h2>
				<div className="bg-gray-50 p-8 rounded-lg text-center">
					<p className="text-gray-600 mb-4">
						No quizzes found for this lesson.
					</p>
					<p className="text-sm text-gray-500">
						Create a quiz to test student knowledge on this lesson.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<h2 className="text-2xl font-bold text-gray-800">Quizzes</h2>

			{quizzesData.quizzes.map((quiz, quizIndex) => (
				<div
					key={quiz.id}
					className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
				>
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-semibold text-gray-800">
							Quiz {quizIndex + 1}
						</h3>
						<p className="text-sm text-gray-500">
							Created: {formatDateToString(quiz.createdAt)}
						</p>
					</div>

					<div className="space-y-6">
						{quiz.questions &&
							Array.isArray(quiz.questions) &&
							(quiz.questions as Question[]).map(
								(question: Question, questionIndex: number) => (
									<div
										key={questionIndex}
										className="border-l-4 border-blue-500 pl-4"
									>
										<h4 className="font-medium text-gray-800 mb-3">
											{questionIndex + 1}. {question.title}
										</h4>

										<div className="space-y-2">
											{question.answers.map(
												(answer: string, answerIndex: number) => (
													<div
														key={answerIndex}
														className={`flex items-center p-3 rounded-md transition-colors ${
															answerIndex === question.correctAnswerIndex
																? "bg-green-50 border border-green-200"
																: "bg-gray-50 border border-gray-200"
														}`}
													>
														<div
															className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
																answerIndex === question.correctAnswerIndex
																	? "border-green-500 bg-green-500"
																	: "border-gray-300"
															}`}
														>
															{answerIndex === question.correctAnswerIndex && (
																<svg
																	className="w-3 h-3 text-white"
																	fill="currentColor"
																	viewBox="0 0 20 20"
																>
																	<path
																		fillRule="evenodd"
																		d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
																		clipRule="evenodd"
																	/>
																</svg>
															)}
														</div>
														<span
															className={`text-sm ${
																answerIndex === question.correctAnswerIndex
																	? "text-green-800 font-medium"
																	: "text-gray-700"
															}`}
														>
															{answer}
														</span>
														{answerIndex === question.correctAnswerIndex && (
															<span className="ml-auto text-xs text-green-600 font-medium">
																Correct Answer
															</span>
														)}
													</div>
												)
											)}
										</div>
									</div>
								)
							)}
					</div>
				</div>
			))}
		</div>
	);
}

function QuizzesSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-8 w-32" />
			<div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
				<div className="flex items-center justify-between mb-4">
					<Skeleton className="h-6 w-20" />
					<Skeleton className="h-4 w-32" />
				</div>
				<div className="space-y-6">
					<div className="border-l-4 border-gray-200 pl-4">
						<Skeleton className="h-5 w-3/4 mb-3" />
						<div className="space-y-2">
							{[1, 2, 3, 4].map((i) => (
								<div
									key={i}
									className="flex items-center p-3 rounded-md bg-gray-50 border border-gray-200"
								>
									<Skeleton className="w-6 h-6 rounded-full mr-3" />
									<Skeleton className="h-4 flex-1" />
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function AttachmentsSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<Skeleton className="h-8 w-32" />
				<Skeleton className="h-10 w-36" />
			</div>
			<div className="grid gap-4">
				{[1, 2, 3].map((i) => (
					<div
						key={i}
						className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
					>
						<div className="flex items-center gap-3">
							<Skeleton className="w-8 h-8" />
							<div>
								<Skeleton className="h-5 w-32 mb-2" />
								<Skeleton className="h-4 w-48" />
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Skeleton className="h-8 w-24" />
							<Skeleton className="h-8 w-8" />
							<Skeleton className="h-8 w-8" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function LessonAttachments({ lesson }: { lesson: Segment }) {
	const { attachments } = useLoaderData<typeof loader>();
	const attachmentsData = React.use(attachments);

	if (
		!attachmentsData.success ||
		!attachmentsData.attachments ||
		attachmentsData.attachments.length === 0
	) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl font-bold text-gray-800">Attachments</h2>
					<AddAttachmentDialog lessonId={lesson.id} />
				</div>

				<div className="bg-gray-50 p-8 rounded-lg text-center">
					<FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
					<p className="text-gray-600 mb-4">
						No attachments found for this lesson.
					</p>
					<p className="text-sm text-gray-500">
						Add attachments to provide additional resources for students.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold text-gray-800">Attachments</h2>
				<AddAttachmentDialog lessonId={lesson.id} />
			</div>

			<div className="grid gap-4 overflow-hidden">
				{attachmentsData.attachments.map((attachment) => (
					<div
						key={attachment.id}
						className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4 shadow-sm overflow-x-auto"
					>
						<div className="flex items-center gap-3">
							<FileText className="w-8 h-8 text-blue-500" />
							<div>
								<h3 className="font-medium text-gray-800 truncate">
									{attachment.fileName}
								</h3>
								<p className="text-sm text-gray-500">
									{attachment.fileExtension.toUpperCase()} • Uploaded{" "}
									{formatDateToString(attachment.createdAt)}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Button variant="outline" size="sm" asChild>
								<a
									href={attachment.fileUrl}
									target="_blank"
									rel="noopener noreferrer"
								>
									<Download className="w-4 h-4 mr-2" />
									Download
								</a>
							</Button>
							<EditAttachmentDialog attachment={attachment} />
							<DeleteAttachmentDialog attachment={attachment} />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function AddAttachmentDialog({ lessonId }: { lessonId: string }) {
	const [isOpen, setIsOpen] = useState(false);
	const [attachments, setAttachments] = useState<File[]>([]);
	const fetcher = useFetcher<FetcherResponse>();
	const isSubmitting = fetcher.state !== "idle";

	const form = useForm<AttachmentUploadSchema>({
		resolver: zodResolver(attachmentUploadSchema),
		defaultValues: {
			attachments: [],
		},
	});

	const onDrop = useCallback(
		(acceptedFiles: File[]) => {
			const newAttachments = [...attachments, ...acceptedFiles];
			setAttachments(newAttachments);
			form.setValue("attachments", newAttachments);
		},
		[attachments, form]
	);

	const { getRootProps, getInputProps, isDragActive, fileRejections } =
		useDropzone({
			onDrop,
			maxSize: MAX_FILE_SIZE,
			accept: DROPZONE_ACCEPTED_TYPES,
			multiple: true,
		});

	const removeAttachment = (index: number) => {
		const newAttachments = attachments.filter((_, i) => i !== index);
		setAttachments(newAttachments);
		form.setValue("attachments", newAttachments);
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<PrimaryButton type="button">
					<Plus className="w-4 h-4 mr-2" />
					Add Attachment
				</PrimaryButton>
			</DialogTrigger>
			<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Add Attachments</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<fetcher.Form
						method="POST"
						action="/resource/attachments"
						className="space-y-6"
						encType="multipart/form-data"
						onSubmit={form.handleSubmit((data) => {
							const formData = new FormData();
							formData.append("intent", "create-attachment");
							formData.append("lessonId", lessonId);

							if (data.attachments) {
								data.attachments.forEach((file) => {
									formData.append("attachments", file);
								});
							}

							fetcher.submit(formData, {
								method: "POST",
								action: "/resource/attachments",
								encType: "multipart/form-data",
							});
						})}
					>
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
										Select Files to Upload
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
											<p className="text-sm font-medium">Files to Upload:</p>
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

						<div className="flex justify-end gap-3">
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsOpen(false)}
								disabled={isSubmitting}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={isSubmitting || attachments.length === 0}
							>
								{isSubmitting ? "Uploading..." : "Upload Attachments"}
							</Button>
						</div>
					</fetcher.Form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

function EditAttachmentDialog({ attachment }: { attachment: Attachment }) {
	const [isOpen, setIsOpen] = useState(false);
	const [fileName, setFileName] = useState(attachment.fileName);
	const fetcher = useFetcher<FetcherResponse>();
	const isSubmitting = fetcher.state !== "idle";

	const handleSubmit = () => {
		if (!fileName.trim()) return;

		const formData = new FormData();
		formData.append("intent", "update-attachment");
		formData.append("attachmentId", attachment.id);
		formData.append("fileName", fileName.trim());

		fetcher.submit(formData, {
			method: "POST",
			action: "/resource/attachments",
		});
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
				>
					<Pencil className="w-4 h-4" />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit File Name</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div>
						<label
							htmlFor="fileName"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							File Name
						</label>
						<Input
							id="fileName"
							value={fileName}
							onChange={(e) => setFileName(e.target.value)}
							placeholder="Enter file name"
							disabled={isSubmitting}
							className="w-full"
						/>
						<p className="text-xs text-gray-500 mt-1">
							This name will be displayed to students when they view the lesson.
						</p>
					</div>
					<div className="flex justify-end gap-3">
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsOpen(false)}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button
							type="button"
							onClick={handleSubmit}
							disabled={
								isSubmitting ||
								!fileName.trim() ||
								fileName.trim() === attachment.fileName
							}
						>
							{isSubmitting ? "Saving..." : "Save Changes"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function DeleteAttachmentDialog({ attachment }: { attachment: Attachment }) {
	const [isOpen, setIsOpen] = useState(false);
	const fetcher = useFetcher<FetcherResponse>();
	const isSubmitting = fetcher.state !== "idle";

	const handleDelete = () => {
		const formData = new FormData();
		formData.append("intent", "delete-attachment");
		formData.append("attachmentId", attachment.id);

		fetcher.submit(formData, {
			method: "POST",
			action: "/resource/attachments",
		});
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="text-red-600 hover:text-red-700 hover:bg-red-50"
				>
					<Trash2 className="w-4 h-4" />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete Attachment</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<p className="text-gray-600">
						Are you sure you want to delete "{attachment.fileName}"? This action
						cannot be undone.
					</p>
					<div className="flex justify-end gap-3">
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsOpen(false)}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="destructive"
							onClick={handleDelete}
							disabled={isSubmitting}
						>
							{isSubmitting ? "Deleting..." : "Delete"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
