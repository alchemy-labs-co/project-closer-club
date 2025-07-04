import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { data, Link, redirect, useFetcher } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
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
import { GetTeamLeaderById } from "~/lib/admin/data-access/team-leader/team-leaders.server";
import type { FetcherResponse } from "~/lib/types";
import { generateRandomPassword } from "~/lib/utils";
import {
	updateTeamLeaderPasswordSchema,
	type UpdateTeamLeaderPasswordSchema,
} from "~/lib/zod-schemas/team-leader";
import type { Route } from "./+types/_admin.dashboard.team-leaders_.$teamleaderId_.edit_.password";

export async function loader({ request, params }: Route.LoaderArgs) {
	const { teamleaderId } = params;
	if (!teamleaderId) {
		throw redirect("/dashboard/team-leaders");
	}

	const { success, teamLeader } = await GetTeamLeaderById(
		request,
		teamleaderId,
	);
	if (!success || !teamLeader) {
		throw redirect("/dashboard/team-leaders");
	}

	return data({ success: true, teamLeader }, { status: 200 });
}

export default function EditPasswordPage({ loaderData }: Route.ComponentProps) {
	const { teamLeader } = loaderData;
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [hasCopied, setHasCopied] = useState(false);
	const fetcher = useFetcher<FetcherResponse>();
	const isSubmitting = fetcher.state === "submitting";
	const form = useForm<UpdateTeamLeaderPasswordSchema>({
		resolver: zodResolver(updateTeamLeaderPasswordSchema),
		defaultValues: {
			password: "",
		},
	});
	useEffect(() => {
		if (fetcher.data) {
			if (fetcher.data.success) {
				setIsDialogOpen(true);
			}
			if (!fetcher.data.success) {
				form.reset();
			}
		}
	}, [fetcher.data, form.reset]);
	useEffect(() => {
		if (hasCopied) {
			toast.success("Copied to clipboard");
			setHasCopied(false);
		}
	}, [hasCopied]);

	return (
		<div className="flex flex-col gap-6 py-4">
			<div className="flex items-center gap-2">
				<Button variant="ghost" size="sm" asChild>
					<Link to={`/dashboard/team-leaders/${teamLeader.teamLeaderId}/edit`}>
						<ArrowLeft className="h-4 w-4 mr-1" />
						Back to Team Leader Profile
					</Link>
				</Button>
			</div>
			<div className="max-w-2xl w-full mx-auto flex flex-col gap-4">
				<Form {...form}>
					<fetcher.Form
						className="flex flex-col gap-4"
						action={"/resource/team-leaders"}
						method="POST"
						onSubmit={form.handleSubmit((data) => {
							fetcher.submit(
								{
									...data,
									intent: "update-team-leader-password",
									teamLeaderId: teamLeader.teamLeaderId,
								},
								{
									method: "POST",
									action: "/resource/team-leaders",
								},
							);
						})}
					>
						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password</FormLabel>
									<FormControl>
										<Input
											type="text"
											placeholder="Enter new password"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="flex flex-col items-start gap-2">
							<Button
								type="button"
								variant="link"
								onClick={() => {
									const randomPassword = generateRandomPassword();
									form.setValue("password", randomPassword);
								}}
							>
								Generate Random Password
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? "Updating..." : "Update Password"}
							</Button>
						</div>
					</fetcher.Form>
					{/* generate random password */}
				</Form>
			</div>
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="fle flex-col gap-8">
					<DialogHeader>New Password</DialogHeader>
					<DialogDescription className="flex flex-col gap-8">
					
							Password: {form.getValues("password")}
					
						<Button
							variant={"outline"}
							className="cursor-pointer"
							onClick={() => {
								navigator.clipboard.writeText(
									`Password: ${form.getValues("password")}`,
								);
								setHasCopied(true);
								setIsDialogOpen(false);
							}}
						>
							Copy to Clipboard
						</Button>
					</DialogDescription>
				</DialogContent>
			</Dialog>
		</div>
	);
}
