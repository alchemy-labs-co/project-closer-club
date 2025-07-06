import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { data, Link, redirect, useFetcher } from "react-router";
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
import { GetStudentById } from "~/lib/admin/data-access/students.server";
import type { FetcherResponse } from "~/lib/types";
import {
	updateStudentSchema,
	type UpdateStudentSchema,
} from "~/lib/zod-schemas/student";
import type { Route } from "./+types/_admin.dashboard.agents_.$studentId_.edit";
export async function loader({ request, params }: Route.LoaderArgs) {
	const { studentId } = params;
	if (!studentId) {
		throw redirect("/dashboard/agents");
	}
	const { success, student } = await GetStudentById(request, studentId);
	if (!success || !student) {
		throw redirect("/dashboard/agents");
	}
	return data({ success: true, student }, { status: 200 });
}

export default function EditStudentPage({ loaderData }: Route.ComponentProps) {
	const { student } = loaderData;
	const fetcher = useFetcher<FetcherResponse>();
	const isSubmitting = fetcher.state === "submitting";
	const form = useForm<UpdateStudentSchema>({
		resolver: zodResolver(updateStudentSchema),
		defaultValues: {
			name: student.name,
			email: student.email,
			phoneNumber: student.phone ?? "",
		},
	});

	const isThereAnyChanges = form.formState.isDirty;

	return (
		<div className="flex flex-col gap-6 py-4">
			<div className="flex items-center gap-2">
				<Button variant="ghost" size="sm" asChild>
					<Link to={`/dashboard/agents/${student.studentId}`}>
						<ArrowLeft className="h-4 w-4 mr-1" />
						Back to Student Profile
					</Link>
				</Button>
			</div>

			<Card className="max-w-2xl mx-auto w-full">
				<CardHeader>
					<CardTitle>Edit Student</CardTitle>
					<CardDescription>Update the student's information</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<fetcher.Form
							method="POST"
							action="/resource/student"
							className="flex flex-col gap-4"
							onSubmit={form.handleSubmit((data) => {
								// if the data is the same just return
								if (
									JSON.stringify(data) ===
									JSON.stringify({
										name: student.name,
										email: student.email,
										phoneNumber: student.phone ?? "",
									})
								) {
									return;
								}
								fetcher.submit(
									{
										...data,
										studentId: student.studentId,
										intent: "update-student",
									},
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
								defaultValue={student.name}
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
								defaultValue={student.phone ?? ""}
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
								defaultValue={student.email}
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Email <span className="text-xs text-red-500">*</span>
										</FormLabel>
										<FormControl>
											<Input
												placeholder="Enter agent email"
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
									<Link to={`/dashboard/agents/${student.id}`}>Cancel</Link>
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
					<Link to={`/dashboard/agents/${student.studentId}/edit/password`}>
						<Button variant="link" size="sm">
							Change Student Password
						</Button>
					</Link>
				</CardContent>
			</Card>
		</div>
	);
}
