import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useFetcher } from "react-router";
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
}: {
	name: string;
	description: string;
	courseId: string;
	slug: string;
}) {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const fetcher = useFetcher<FetcherResponse>();
	const isSubmitting = fetcher.state === "submitting";
	const form = useForm<UpdateCourseSchema>({
		resolver: zodResolver(updateCourseSchema),
		defaultValues: {
			name: name,
			description: description,
		},
	});

	useEffect(() => {
		if (fetcher.data) {
			if (fetcher.data.success) {
				toast.success(fetcher.data.message);
				setIsDialogOpen(false);
			}
			if (!fetcher.data.success) {
				toast.error(fetcher.data.message);
			}
		}
	}, [fetcher.data]);
	return (
		<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<DialogTrigger asChild>
				<div className="w-6 h-6 flex items-center cursor-pointer justify-center rounded-full bg-gray-200">
					<Pencil className="w-4 h-4 text-gray-500  hover:text-gray-700" />
				</div>
			</DialogTrigger>
			<DialogContent className="flex flex-col gap-8">
				<DialogHeader>
					<DialogTitle>Edit Course</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<fetcher.Form
						method="POST"
						action="/resource/course"
						className="flex flex-col gap-4"
						onSubmit={form.handleSubmit((data) => {
							fetcher.submit(
								{ ...data, intent: "edit-course", id: courseId, slug: slug },
								{
									action: "/resource/course",
									method: "POST",
								}
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
