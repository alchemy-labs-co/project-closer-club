import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { data, Link, redirect, useFetcher } from "react-router";
import { toast } from "sonner";
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
import { GetTeamLeaderById } from "~/lib/admin/data-access/team-leader/team-leaders.server";
import type { FetcherResponse } from "~/lib/types";
import {
	updateTeamLeaderSchema,
	type UpdateTeamLeaderSchema,
} from "~/lib/zod-schemas/team-leader";
import type { Route } from "./+types/_admin.dashboard.team-leaders_.$teamleaderId_.edit";

export async function loader({ request, params }: Route.LoaderArgs) {
	const { teamleaderId } = params;

	if (!teamleaderId) {
		throw redirect("/dashboard/team-leaders");
	}
	const { success, teamLeader } = await GetTeamLeaderById(
		request,
		teamleaderId
	);
	if (!success || !teamLeader) {
		throw redirect("/dashboard/team-leaders");
	}
	return data({ success: true, teamLeader }, { status: 200 });
}

export default function EditTeamLeaderPage({
	loaderData,
}: Route.ComponentProps) {
	const { teamLeader } = loaderData;
	const fetcher = useFetcher<FetcherResponse>();
	const isSubmitting = fetcher.state === "submitting";
	const form = useForm<UpdateTeamLeaderSchema>({
		resolver: zodResolver(updateTeamLeaderSchema),
		defaultValues: {
			name: teamLeader.name,
			email: teamLeader.email,
			phoneNumber: teamLeader.phone ?? "",
		},
	});

	const isThereAnyChanges = form.formState.isDirty;

	useEffect(() => {
		if (fetcher.data) {
			if (fetcher.data.success) {
				toast.success(fetcher.data.message);
			}
			if (!fetcher.data.success) {
				toast.error(fetcher.data.message);
				form.reset();
			}
		}
	}, [fetcher.data, form.reset]);

	return (
		<div className="flex flex-col gap-6 py-4">
			<div className="flex items-center gap-2">
				<Button variant="ghost" size="sm" asChild>
					<Link to={`/dashboard/team-leaders/${teamLeader.teamLeaderId}`}>
						<ArrowLeft className="h-4 w-4 mr-1" />
						Back to Team Leader Profile
					</Link>
				</Button>
			</div>

			<Card className="max-w-2xl mx-auto w-full">
				<CardHeader>
					<CardTitle>Edit Team Leader</CardTitle>
					<CardDescription>
						Update the team leader's information
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<fetcher.Form
							method="POST"
							action="/resource/team-leaders"
							className="flex flex-col gap-4"
							onSubmit={form.handleSubmit((data) => {
								// if the data is the same just return
								if (
									JSON.stringify(data) ===
									JSON.stringify({
										name: teamLeader.name,
										email: teamLeader.email,
										phoneNumber: teamLeader.phone ?? "",
									})
								) {
									return;
								}
								fetcher.submit(
									{
										...data,
										teamLeaderId: teamLeader.teamLeaderId,
										intent: "update-team-leader",
									},
									{
										action: "/resource/team-leaders",
										method: "POST",
									}
								);
							})}
						>
							<FormField
								control={form.control}
								name="name"
								defaultValue={teamLeader.name}
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
								defaultValue={teamLeader.phone ?? ""}
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
								defaultValue={teamLeader.email}
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Email <span className="text-xs text-red-500">*</span>
										</FormLabel>
										<FormControl>
											<Input
												placeholder="Enter team leader email"
												type="email"
												{...field}
											/>
										</FormControl>
										<FormMessage />
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
										to={`/dashboard/team-leaders/${teamLeader.teamLeaderId}`}
									>
										Cancel
									</Link>
								</Button>
								<PrimaryButton
									type="submit"
									disabled={isSubmitting || !isThereAnyChanges}
								>
									{isSubmitting ? "Saving Changes..." : "Save Changes"}
								</PrimaryButton>
							</div>
						</fetcher.Form>
					</Form>
					<Link to={`/dashboard/team-leaders/${teamLeader.id}/edit/password`}>
						<Button variant="link" size="sm">
							Change Team Leader Password
						</Button>
					</Link>
				</CardContent>
			</Card>
		</div>
	);
}
