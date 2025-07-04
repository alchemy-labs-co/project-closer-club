import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useFetcher } from "react-router";
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
	createTeamLeaderSchema,
	type CreateTeamLeaderSchema,
} from "~/lib/zod-schemas/team-leader";
import { AssignAgentsToTeamLeader } from "./assign-agents-to-team-leader";
import EmailDomainInput from "../students/email-domain-input";

export function CreateTeamLeader() {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [hasCopied, setHasCopied] = useState(false);
	const fetcher = useFetcher<FetcherResponse>();
	const isSubmitting = fetcher.state === "submitting";

	const form = useForm<CreateTeamLeaderSchema>({
		resolver: zodResolver(createTeamLeaderSchema),
		defaultValues: {
			name: "",
			email: "",
			phoneNumber: "",
			password: generateRandomPassword(),
			agents: [],
		},
	});

	useEffect(() => {
		if (fetcher.data) {
			if (fetcher.data.success) {
				setIsSubmitted(true);
			}
		}
	}, [fetcher.data]);

	useEffect(() => {
		// when dialog closes reset the form
		if (!isDialogOpen) {
			form.reset();
			setIsSubmitted(false);
		}
	}, [isDialogOpen, form.reset]);

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
					Add Team Leader
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
						<DialogTitle>Create Team Leader</DialogTitle>
					</DialogHeader>
					<Form {...form}>
						<fetcher.Form
							method="POST"
							action="/resource/team-leaders"
							className="flex flex-col gap-4"
							onSubmit={form.handleSubmit((data) => {
								fetcher.submit(
									{ ...data, intent: "create-team-leader" },
									{
										action: "/resource/team-leaders",
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
												placeholder="Enter team leader name"
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
												placeholder="Enter team leader phone number"
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
											<EmailDomainInput
												placeholder="Enter team leader username"
												value={field.value}
												onChange={field.onChange}
												disabled={isSubmitting}
												className="bg-white text-black focus-visible:ring-0 focus-visible:ring-offset-0"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="agents"
								disabled={isSubmitting}
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Agents{" "}
											<span className="text-xs text-gray-500">(optional)</span>
										</FormLabel>
										<FormControl>
											<AssignAgentsToTeamLeader form={form} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							{/* Submit button */}
							<PrimaryButton type="submit" disabled={isSubmitting}>
								{isSubmitting ? "Adding Team Leader..." : "Add Team Leader"}
							</PrimaryButton>
						</fetcher.Form>
					</Form>
				</DialogContent>
			)}
		</Dialog>
	);
}

// submitted state should show the email and password of the new team leader and ability to copy to clipboard
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
				<DialogTitle>Team Leader Created</DialogTitle>
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
