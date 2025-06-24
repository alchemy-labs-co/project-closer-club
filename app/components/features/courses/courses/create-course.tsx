import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useFetcher, useNavigate } from "react-router";
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
	createCourseSchema,
	type CreateCourseSchema,
} from "~/lib/zod-schemas/course";
import { AssignStudentToCourse } from "../../students/assign-students-to-course";
type CreateCourseFetcherResponse = FetcherResponse & {
	courseSlug: string;
};
export function CreateCourse() {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const fetcher = useFetcher<CreateCourseFetcherResponse>();
	const isSubmitting = fetcher.state === "submitting";
	const navigate = useNavigate();
	const form = useForm<CreateCourseSchema>({
		resolver: zodResolver(createCourseSchema),
		defaultValues: {
			name: "",
			description: "",
			students: [],
		},
	});

	useEffect(() => {
		if (fetcher.data) {
			if (fetcher.data.success) {
				toast.success(fetcher.data.message);
				if (fetcher.data.courseSlug) {
					navigate(`/dashboard/courses/${fetcher.data.courseSlug}`);
				}
			}
			if (!fetcher.data.success) {
				toast.error(fetcher.data.message);
			}
		}
	}, [fetcher.data]);
	return (
		<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<DialogTrigger asChild>
				<PrimaryButton>Add Course</PrimaryButton>
			</DialogTrigger>
			<DialogContent className="flex flex-col gap-8">
				<DialogHeader>
					<DialogTitle>Create Course</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<fetcher.Form
						method="POST"
						action="/resource/course"
						className="flex flex-col gap-4"
						onSubmit={form.handleSubmit((data) => {
							fetcher.submit(
								{ ...data, intent: "create-course" },
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

						<FormField
							control={form.control}
							name="students"
							disabled={isSubmitting}
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Students <span className="text-xs text-red-500">*</span>
									</FormLabel>
									<FormControl>
										<AssignStudentToCourse form={form} {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Submit button */}
						<PrimaryButton type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Creating Course..." : "Create Course"}
						</PrimaryButton>
					</fetcher.Form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
