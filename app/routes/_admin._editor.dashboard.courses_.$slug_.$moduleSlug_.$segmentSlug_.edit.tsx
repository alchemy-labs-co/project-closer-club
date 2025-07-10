import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, redirect, useFetcher, useNavigate } from "react-router";
import { DeleteSegment } from "~/components/features/courses/segments/delete-segment";
import PrimaryButton from "~/components/global/brand/primary-button";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
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
import { getModuleBySlug } from "~/lib/admin/data-access/modules/modules.server";
import { isAdminLoggedIn } from "~/lib/auth/auth.server";
import type { FetcherResponse } from "~/lib/types";
import { formatDateToString } from "~/lib/utils";
import {
	editSegmentSchema,
	type EditSegmentSchema,
} from "~/lib/zod-schemas/segment";
import type { Route } from "./+types/_admin._editor.dashboard.courses_.$slug_.$moduleSlug_.$segmentSlug_.edit";

export async function loader({ request, params }: Route.LoaderArgs) {
	// auth check
	const { isLoggedIn } = await isAdminLoggedIn(request);
	if (!isLoggedIn) {
		throw redirect("/admin/login");
	}

	const { slug: courseSlug, moduleSlug, segmentSlug } = params;

	if (!courseSlug || !moduleSlug || !segmentSlug) {
		throw redirect("/dashboard/courses");
	}

	// get module with lessons to find the specific lesson
	const { success, module } = await getModuleBySlug(
		request,
		moduleSlug,
		courseSlug,
	);

	if (!success || !module) {
		throw redirect(`/dashboard/courses/${courseSlug}`);
	}

	// find the specific lesson within the module
	const lesson = module.lessons.find((lesson) => lesson.slug === segmentSlug);

	if (!lesson) {
		throw redirect(`/dashboard/courses/${courseSlug}/${moduleSlug}`);
	}

	return {
		courseSlug,
		moduleSlug,
		lesson,
		module,
	};
}

type EditLessonFetcherResponse = FetcherResponse & {
	redirectTo?: string;
};

export default function EditLesson({ loaderData }: Route.ComponentProps) {
	const { courseSlug, moduleSlug, lesson, module } = loaderData;
	const fetcher = useFetcher<EditLessonFetcherResponse>();
	const navigate = useNavigate();
	const isSubmitting = fetcher.state === "submitting";

	const form = useForm<EditSegmentSchema>({
		resolver: zodResolver(editSegmentSchema),
		defaultValues: {
			name: lesson.name,
			description: lesson.description || "",
			videoUrl: lesson.videoUrl,
			courseSlug: courseSlug,
			moduleSlug: moduleSlug,
			segmentSlug: lesson.slug,
		},
	});

	return (
		<div className="p-4 flex flex-col gap-4 overflow-y-auto h-full">
			{/* Go back to lesson */}
			<Button variant={"link"} asChild>
				<Link
					to={`/dashboard/courses/${courseSlug}/${moduleSlug}/${lesson.slug}`}
				>
					<ArrowLeftIcon className="w-4 h-4" />
					Back to lesson
				</Link>
			</Button>

			{/* Editing Information */}
			<Card className="max-w-2xl mx-auto w-full">
				<CardHeader>
					<CardTitle>Edit Lesson</CardTitle>
					<CardDescription>
						Update the lesson's information in <strong>{module.name}</strong>{" "}
						module
						<br />
						<span className="text-xs text-gray-500">
							Created: {formatDateToString(lesson.created_at)}
						</span>
					</CardDescription>
				</CardHeader>
				<CardContent className="border-b border-t py-4">
					<Form {...form}>
						<fetcher.Form
							method="POST"
							action="/resource/segment"
							className="flex flex-col gap-4"
							onSubmit={form.handleSubmit((data) => {
								// if the data is the same just return
								if (
									JSON.stringify({
										name: data.name,
										description: data.description,
										videoUrl: data.videoUrl,
									}) ===
									JSON.stringify({
										name: lesson.name,
										description: lesson.description || "",
										videoUrl: lesson.videoUrl,
									})
								) {
									return;
								}
								fetcher.submit(
									{ ...data, intent: "edit-segment" },
									{
										action: "/resource/segment",
										method: "POST",
									},
								);
							})}
						>
							<FormField
								control={form.control}
								name="name"
								disabled={isSubmitting}
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Lesson Name{" "}
											<span className="text-xs text-red-500">*</span>
										</FormLabel>
										<FormControl>
											<Input
												placeholder="Enter lesson name"
												type="text"
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
											Description{" "}
											<span className="text-xs text-gray-500">(optional)</span>
										</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Enter lesson description"
												className="min-h-[100px]"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="videoUrl"
								disabled={isSubmitting}
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Video URL <span className="text-xs text-red-500">*</span>
										</FormLabel>
										<FormControl>
											<Input
												placeholder="Enter video URL"
												type="text"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Hidden fields */}
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

							<FormField
								control={form.control}
								name="segmentSlug"
								disabled={isSubmitting}
								render={({ field }) => (
									<FormItem>
										<FormControl>
											<Input hidden {...field} />
										</FormControl>
									</FormItem>
								)}
							/>

							<div className="flex justify-end gap-2 pt-4">
								<Button
									type="button"
									variant="outline"
									className="cursor-pointer"
									disabled={isSubmitting}
									asChild
								>
									<Link
										to={`/dashboard/courses/${courseSlug}/${moduleSlug}/${lesson.slug}`}
									>
										Cancel
									</Link>
								</Button>
								<PrimaryButton type="submit" disabled={isSubmitting}>
									{isSubmitting ? "Saving Changes..." : "Save Changes"}
								</PrimaryButton>
							</div>
						</fetcher.Form>
					</Form>
				</CardContent>

				{/* Additional Actions Section */}
				<div className="flex flex-col gap-4 px-4 py-4">
					<h4 className="text-lg font-medium">Additional Actions</h4>

					<div className="flex gap-2 md:flex-row flex-col items-center justify-between">
						<DeleteSegment segmentId={lesson.id} courseSlug={courseSlug} />
					</div>
				</div>
			</Card>
		</div>
	);
}
