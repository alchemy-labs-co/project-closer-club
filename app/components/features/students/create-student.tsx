import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useFetcher, useParams } from "react-router";
import { toast } from "sonner";
import PrimaryButton from "~/components/global/brand/primary-button";
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
import type { FetcherResponse } from "~/lib/types";
import { generateRandomPassword } from "~/lib/utils";
import {
	createStudentSchema,
	type CreateStudentSchema,
} from "~/lib/zod-schemas/student";
import { AssignCourseToStudent } from "./assign-course-to-student";

export function CreateStudent() {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [hasCopied, setHasCopied] = useState(false);
	const fetcher = useFetcher<FetcherResponse>();
	const isSubmitting = fetcher.state === "submitting";

	const form = useForm<CreateStudentSchema>({
		resolver: zodResolver(createStudentSchema),
		defaultValues: {
			name: "",
			email: "",
			phoneNumber: "",
			password: generateRandomPassword(),
			courses: [],
		},
	});

	// /userid/edit

	useEffect(() => {
		if (fetcher.data) {
			if (fetcher.data.success) {
				toast.success(fetcher.data.message);
				setIsSubmitted(true);
			}
			if (!fetcher.data.success) {
				toast.error(fetcher.data.message);
			}
		}
	}, [fetcher.data]);
	// null or undefined

	useEffect(() => {
		// when dialog closes reset the form
		if (!isDialogOpen) {
			form.reset();
			setIsSubmitted(false);
		}
	}, [isDialogOpen]);

	// when hasCopied is true, show toast
	useEffect(() => {
		if (hasCopied) {
			toast.success("Copied to clipboard");
			setHasCopied(false);
		}
	}, [hasCopied]);
	return (
		<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					className="bg-brand-primary h-fit text-white cursor-pointer hover:bg-brand-primary/60 hover:text-white"
				>
					Add Agent
				</Button>
			</DialogTrigger>
			{isSubmitted ? (
				<SubmittedState
					email={form.getValues("email")}
					password={form.getValues("password")}
					setHasCopied={setHasCopied}
				/>
			) : (
				<DialogContent className="flex flex-col gap-8">
					<DialogHeader>
						<DialogTitle>Create Agent</DialogTitle>
					</DialogHeader>
					<Form {...form}>
						<fetcher.Form
							method="POST"
							action="/resource/student"
							className="flex flex-col gap-4"
							onSubmit={form.handleSubmit((data) => {
								fetcher.submit(
									{ ...data, intent: "create-student" },
									{
										action: "/resource/student",
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
											Name <span className="text-xs text-red-500">*</span>
										</FormLabel>
										<FormControl>
											<Input
												placeholder="Enter agent name"
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
								name="phoneNumber"
								disabled={isSubmitting}
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Phone Number{" "}
											<span className="text-xs text-gray-500">(optional)</span>
										</FormLabel>
										<FormControl>
											<Input
												placeholder="Enter agent phone number"
												type="tel"
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
								name="email"
								disabled={isSubmitting}
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Email <span className="text-xs text-red-500">*</span>
										</FormLabel>
										<FormControl>
											<Input
												placeholder="Enter agent email"
												type="email"
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
								name="courses"
								disabled={isSubmitting}
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Courses <span className="text-xs text-red-500">*</span>
										</FormLabel>
										<FormControl>
											<AssignCourseToStudent form={form} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							{/* Submit button */}
							<PrimaryButton type="submit" disabled={isSubmitting}>
								{isSubmitting ? "Adding Agent..." : "Add Agent"}
							</PrimaryButton>
						</fetcher.Form>
					</Form>
				</DialogContent>
			)}
		</Dialog>
	);
}

// submitted state should show the email and pasword of the new student and ability to copy to clipboard
function SubmittedState({
	email,
	password,
	setHasCopied,
}: {
	email: string;
	password: string;
	setHasCopied: (hasCopied: boolean) => void;
}) {
	return (
		<DialogContent className="flex flex-col gap-8">
			<DialogHeader>
				<DialogTitle>Student Created</DialogTitle>
			</DialogHeader>
			<div className="flex flex-col gap-2">
				<p>Email: {email}</p>
				<p>Password: {password}</p>
			</div>
			<Button
				variant={"outline"}
				className="cursor-pointer"
				onClick={() => {
					navigator.clipboard.writeText(
						`Email: ${email}\nPassword: ${password}`,
					);
					setHasCopied(true);
				}}
			>
				Copy to Clipboard
			</Button>
		</DialogContent>
	);
}
