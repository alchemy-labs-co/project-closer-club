import { useLoaderData, useFetcher, Link } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { data, redirect } from "react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Edit3 } from "lucide-react";

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
import { DeleteModule } from "~/components/features/courses/modules/delete-module";
import PrimaryButton from "~/components/global/brand/primary-button";
import {
	editModuleSchema,
	type EditModuleSchema,
} from "~/lib/zod-schemas/module";
import { Button } from "~/components/ui/button";

export async function loader({ request, params }: LoaderFunctionArgs) {
	const { slug: courseSlug, moduleSlug } = params;

	if (!courseSlug || !moduleSlug) {
		throw redirect("/dashboard/courses");
	}

	const { success, module } = await getModuleBySlug(
		request,
		moduleSlug,
		courseSlug,
	);

	if (!success || !module) {
		throw redirect(`/dashboard/courses/${courseSlug}`);
	}

	return data({ module, courseSlug, moduleSlug });
}

type EditModuleFetcherResponse = {
	success: boolean;
	message: string;
	redirectTo?: string;
};

export default function EditModule() {
	const { module, courseSlug, moduleSlug } = useLoaderData<typeof loader>();
	const fetcher = useFetcher<EditModuleFetcherResponse>();
	const isSubmitting = fetcher.state === "submitting";

	const form = useForm<EditModuleSchema>({
		resolver: zodResolver(editModuleSchema),
		defaultValues: {
			name: module.name,
			description: module.description ?? "",
			courseSlug,
			moduleSlug,
		},
	});


	return (
		<div className="space-y-6 p-8">
			<PrimaryButton asChild>
				<Link to={`/dashboard/courses/${courseSlug}/${moduleSlug}`}>
					Back to Module
				</Link>
			</PrimaryButton>
			<div className="flex items-center justify-between">
				<div className="space-y-1">
					<h1 className="text-2xl font-semibold tracking-tight">Edit Module</h1>
					<p className="text-sm text-muted-foreground">
						Update module details and settings
					</p>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Edit3 className="h-5 w-5" />
						Module Information
					</CardTitle>
					<CardDescription>
						Update the basic information for this module
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<fetcher.Form
							method="POST"
							action="/resource/module"
							className="space-y-4"
							onSubmit={form.handleSubmit((data) => {
								fetcher.submit(
									{ ...data, intent: "edit-module" },
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
											Module Name{" "}
											<span className="text-xs text-red-500">*</span>
										</FormLabel>
										<FormControl>
											<Input
												placeholder="Enter module name"
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
										<FormLabel>Description</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Enter module description (optional)"
												className="bg-white text-black focus-visible:ring-0 focus-visible:ring-offset-0"
												rows={4}
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
								render={({ field }) => (
									<FormItem>
										<FormControl>
											<Input type="hidden" {...field} />
										</FormControl>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="moduleSlug"
								render={({ field }) => (
									<FormItem>
										<FormControl>
											<Input type="hidden" {...field} />
										</FormControl>
									</FormItem>
								)}
							/>

							<div className="flex justify-end space-x-2">
								<PrimaryButton type="submit" disabled={isSubmitting}>
									{isSubmitting ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Saving...
										</>
									) : (
										"Save Changes"
									)}
								</PrimaryButton>
							</div>
						</fetcher.Form>
					</Form>
				</CardContent>

				{/* Additional Actions Section */}
				<div className="flex flex-col gap-4 px-4 py-4">
					<h4 className="text-lg font-medium">Additional Actions</h4>

					<div className="flex gap-2 md:flex-row flex-col items-center justify-between">
						<DeleteModule
							moduleSlug={moduleSlug}
							courseSlug={courseSlug}
							moduleName={module.name}
						/>
					</div>
				</div>
			</Card>
		</div>
	);
}
