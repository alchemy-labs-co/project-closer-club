import { useEffect, useState } from "react";
import { useFetcher, useNavigate, useParams, redirect } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
	createModuleSchema,
	type CreateModuleSchema,
} from "~/lib/zod-schemas/module";
import { Textarea } from "~/components/ui/textarea";

type CreateModuleFetcherResponse = {
	success: boolean;
	message: string;
	moduleSlug?: string;
};

export function CreateModule() {
	const { slug: courseSlug } = useParams();
	if (!courseSlug) throw redirect("/dashboard/courses");

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const fetcher = useFetcher<CreateModuleFetcherResponse>();
	const isSubmitting = fetcher.state === "submitting";
	const navigate = useNavigate();

	const form = useForm<CreateModuleSchema>({
		resolver: zodResolver(createModuleSchema),
		defaultValues: {
			name: "",
			description: "",
			courseSlug,
		},
	});

	useEffect(() => {
		if (fetcher.data) {
			if (fetcher.data.success) {
				toast.success(fetcher.data.message);
				setIsDialogOpen(false);
				form.reset();
				// Navigate to the newly created module
				if (fetcher.data.moduleSlug) {
					navigate(
						`/dashboard/courses/${courseSlug}/${fetcher.data.moduleSlug}`,
					);
				}
			}
			if (!fetcher.data.success) {
				toast.error(fetcher.data.message);
			}
		}
	}, [fetcher.data, courseSlug, navigate, form]);

	return (
		<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<DialogTrigger asChild>
				<PrimaryButton>Add Module</PrimaryButton>
			</DialogTrigger>
			<DialogContent className="flex flex-col gap-8">
				<DialogHeader>
					<DialogTitle>Create Module</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<fetcher.Form
						method="POST"
						action="/resource/module"
						className="flex flex-col gap-4"
						onSubmit={form.handleSubmit((data) => {
							fetcher.submit(
								{ ...data, intent: "create-module" },
								{
									action: "/resource/module",
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
										Module Name <span className="text-xs text-red-500">*</span>
									</FormLabel>
									<FormControl>
										<Input
											placeholder="Enter module name"
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
							name="courseSlug"
							defaultValue={courseSlug}
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
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Enter module description"
											className="bg-white text-black focus-visible:ring-0 focus-visible:ring-offset-0"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<PrimaryButton type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Creating Module..." : "Create Module"}
						</PrimaryButton>
					</fetcher.Form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
