import { zodResolver } from "@hookform/resolvers/zod";
import {
	ArrowLeft,
	ArrowRight,
	Calendar,
	Edit,
	Mail,
	Phone,
	User,
} from "lucide-react";
import React, { Suspense } from "react";
import { useForm } from "react-hook-form";
import {
	Link,
	data,
	href,
	redirect,
	useFetcher,
	useLoaderData,
} from "react-router";
import { z } from "zod";
import { StatusBadge } from "~/components/features/students/status-badge";
import { ActivateTeamLeader } from "~/components/features/team-leaders/activate-team-leader";
import { DeactivateTeamLeader } from "~/components/features/team-leaders/deactivate-team-leader";
import PrimaryButton from "~/components/global/brand/primary-button";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem } from "~/components/ui/form";
import { Separator } from "~/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import type { Student, Course } from "~/db/schema";
import { getAllPublicCourses } from "~/lib/admin/data-access/courses.server";
import { 
	GetAllStudents,
	getCoursesTeamLeaderEnrolledIn,
} from "~/lib/admin/data-access/students.server";
import {
	GetTeamLeaderById,
	getAgentsAssignedToTeamLeader,
} from "~/lib/admin/data-access/team-leader/team-leaders.server";
import { formatDateToString } from "~/lib/utils";
import {
	type AssignCourseShema,
	assignCourseSchema,
} from "~/lib/zod-schemas/course";
import type { Route } from "./+types/_admin.dashboard.team-leaders_.$teamleaderId";

export async function loader({ request, params }: Route.LoaderArgs) {
	const { teamleaderId } = params;

	const allStudents = GetAllStudents(request);
	const publicCourses = getAllPublicCourses(request);
	const agentsAssignedToTeamLeader = getAgentsAssignedToTeamLeader(
		request,
		teamleaderId,
	);
	const { success, teamLeader } = await GetTeamLeaderById(
		request,
		teamleaderId as string,
	);

	if (!success || !teamLeader) {
		throw redirect("/dashboard/team-leaders");
	}

	// Get courses assigned to team leader
	const coursesTeamLeaderAssignedTo = getCoursesTeamLeaderEnrolledIn(
		request,
		teamLeader.teamLeaderId,
	);

	return data(
		{
			success: true,
			teamLeader,
			students: allStudents,
			courses: publicCourses,
			coursesTeamLeaderAssignedTo: coursesTeamLeaderAssignedTo,
			agentsAssignedToTeamLeader: agentsAssignedToTeamLeader,
		},
		{ status: 200 },
	);
}

export default function TeamLeaderProfilePage() {
	return (
		<div className="flex flex-col gap-6 py-4">
			<div className="flex items-center gap-2">
				<Button variant="ghost" size="sm" asChild>
					<Link to="/dashboard/team-leaders">
						<ArrowLeft className="h-4 w-4 mr-1" />
						Back to Team Leaders
					</Link>
				</Button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<TeamLeaderInfoMainCard />
				<TeamLeaderStatusCard />
				<Suspense fallback={<p>loading...</p>}>
					<AgentsAssignedToTeamLeader />
				</Suspense>
			</div>

			<Suspense fallback={<p>loading...</p>}>
				<CoursesTeamLeaderAssignedTo />
			</Suspense>
		</div>
	);
}

function TeamLeaderInfoMainCard() {
	const { teamLeader } = useLoaderData<typeof loader>();
	return (
		<Card className="col-span-3 md:col-span-2">
			<CardHeader>
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
					<div>
						<CardTitle className="text-2xl">{teamLeader.name}</CardTitle>
						<CardDescription className="text-base">
							{teamLeader.email}
						</CardDescription>
					</div>
					<div className="flex items-center gap-2">
						<StatusBadge status={teamLeader.isActivated} />
						<Button variant="outline" size="sm" asChild>
							<Link to={`/dashboard/team-leaders/${teamLeader.id}/edit`}>
								<Edit className="h-4 w-4 mr-1" />
								Edit
							</Link>
						</Button>
					</div>
				</div>
			</CardHeader>
			<Separator />
			<CardContent className="pt-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="flex items-start gap-3">
						<div className="bg-primary/10 p-2 rounded-full">
							<User className="h-5 w-5 text-primary" />
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">
								Full Name
							</p>
							<p className="text-base">{teamLeader.name}</p>
						</div>
					</div>
					<div className="flex items-start gap-3">
						<div className="bg-primary/10 p-2 rounded-full">
							<Mail className="h-5 w-5 text-primary" />
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">Email</p>
							<p className="text-base">{teamLeader.email}</p>
						</div>
					</div>
					<div className="flex items-start gap-3">
						<div className="bg-primary/10 p-2 rounded-full">
							<Phone className="h-5 w-5 text-primary" />
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">Phone</p>
							<p className="text-base">{teamLeader.phone || "Not provided"}</p>
						</div>
					</div>
					<div className="flex items-start gap-3">
						<div className="bg-primary/10 p-2 rounded-full">
							<Calendar className="h-5 w-5 text-primary" />
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">
								Joined
							</p>
							<p className="text-base">
								{formatDateToString(new Date(teamLeader.createdAt))}
							</p>
						</div>
					</div>
				</div>
			</CardContent>
			<CardFooter className="flex justify-end gap-2">
				{teamLeader.isActivated ? (
					<DeactivateTeamLeader teamLeaderId={teamLeader.teamLeaderId} />
				) : (
					<ActivateTeamLeader teamLeaderId={teamLeader.teamLeaderId} />
				)}
			</CardFooter>
		</Card>
	);
}

function TeamLeaderStatusCard() {
	const { teamLeader } = useLoaderData<typeof loader>();
	return (
		<Card className="col-span-3 md:col-span-1">
			<CardHeader>
				<CardTitle>Account Status</CardTitle>
				<CardDescription>Manage team leader account access</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<span className="text-sm font-medium">Account Status</span>
						<StatusBadge status={teamLeader.isActivated} />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function AgentsAssignedToTeamLeader() {
	const data = useLoaderData<typeof loader>();
	const teamLeaderId = data.teamLeader.teamLeaderId;
	const { students: allStudents } = React.use(data.students);
	const { agents: agentsAssignedToTeamLeader } = React.use(
		data.agentsAssignedToTeamLeader,
	);
	const assignedAgentIds = new Set(
		agentsAssignedToTeamLeader.map((agent) => agent.studentId),
	);
	const columns: {
		header: string;
		accessorKey: keyof Student;
		cell?: (student: Student) => React.ReactNode;
	}[] = [
		{ header: "Name", accessorKey: "name" },
		{ header: "Email", accessorKey: "email" },
		{ header: "Phone", accessorKey: "phone" },
	];

	const areThereStudents = allStudents.length > 0;

	return (
		<div className="col-span-3 flex flex-col gap-4 md:gap-6">
			<h3 className="text-xl md:text-3xl font-medium">Agents</h3>
			{areThereStudents && (
				<Table>
					<TableHeader>
						<TableRow className="bg-muted/50">
							{columns.map((column) => (
								<TableHead
									key={String(column.accessorKey)}
									className={`h-9 py-2 ${
										column.accessorKey === "name"
											? "sticky left-0 bg-muted font-medium xl:static xl:bg-inherit"
											: ""
									}`}
								>
									{column.header}
								</TableHead>
							))}
							<TableHead>Assign</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{allStudents.map((student) => (
							<TableRow key={student.id}>
								{columns.map((column) => (
									<TableCell
										key={String(column.accessorKey)}
										className={`py-2 ${
											column.accessorKey === "name"
												? "sticky left-0 z-10 bg-muted font-medium xl:static xl:bg-inherit"
												: ""
										}`}
									>
										{column.cell ? (
											column.cell(student)
										) : (
											<>{String(student[column.accessorKey])}</>
										)}
									</TableCell>
								))}
								<TableCell>
									<TeamLeaderAgentAssignmentCheckbox
										isAssigned={assignedAgentIds.has(student.studentId)}
										teamLeaderId={teamLeaderId}
										studentId={student.studentId}
									/>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
			{!areThereStudents && (
				<div className="flex flex-col gap-4 justify-center items-center w-full">
					<p className="text-sm text-muted-foreground">No agents available.</p>
					<Link to={href("/dashboard/agents")}>
						<PrimaryButton variant="outline">
							Go to Agents <ArrowRight className="h-4 w-4 ml-2" />
						</PrimaryButton>
					</Link>
				</div>
			)}
		</div>
	);
}

function TeamLeaderAgentAssignmentCheckbox({
	isAssigned,
	teamLeaderId,
	studentId,
}: {
	isAssigned: boolean;
	teamLeaderId: string;
	studentId: string;
}) {
	const fetcher = useFetcher();

	const form = useForm<{ isAssigned: boolean }>({
		resolver: zodResolver(
			z.object({
				isAssigned: z.boolean(),
			}),
		),
		defaultValues: {
			isAssigned,
		},
	});

	return (
		<Form {...form}>
			<fetcher.Form
				action="/resource/team-leaders"
				method="POST"
				className="space-y-6"
			>
				<FormField
					control={form.control}
					name="isAssigned"
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<Checkbox
									checked={field.value}
									onCheckedChange={(checked) => {
										field.onChange(checked);
										fetcher.submit(
											{
												isAssigned: checked,
												teamLeaderId,
												studentId,
												intent: "update-agent-assignment",
											},
											{
												action: "/resource/team-leaders",
												method: "POST",
											},
										);
									}}
								/>
							</FormControl>
						</FormItem>
					)}
				/>
			</fetcher.Form>
		</Form>
	);
}

function CoursesTeamLeaderAssignedTo() {
	const data = useLoaderData<typeof loader>();
	const teamLeaderId = data.teamLeader.teamLeaderId;
	const { courses: allPublicCourses } = React.use(data.courses);
	const { courses: coursesTeamLeaderAssignedTo } = React.use(
		data.coursesTeamLeaderAssignedTo,
	);
	const assignedCourseIds = new Set(
		coursesTeamLeaderAssignedTo.map((course) => course.id),
	);
	const columns: {
		header: string;
		accessorKey: keyof Course;
		cell?: (course: Course) => React.ReactNode;
	}[] = [
		{ header: "Name", accessorKey: "name" },
		{ header: "Description", accessorKey: "description" },
	];

	const areTherePublicCourses = allPublicCourses.length > 0;

	return (
		<div className="col-span-3 flex flex-col gap-4 md:gap-6">
			<h3 className="text-xl md:text-3xl font-medium">
				Courses team leader is assigned to:
			</h3>
			{areTherePublicCourses && (
				<Table>
					<TableHeader>
						<TableRow className="bg-muted/50">
							{columns.map((column) => (
								<TableHead
									key={String(column.accessorKey)}
									className={`h-9 py-2 ${
										column.accessorKey === "name"
											? "sticky left-0 bg-muted font-medium xl:static xl:bg-inherit"
											: ""
									}`}
								>
									{column.header}
								</TableHead>
							))}
							<TableHead>Assign</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{allPublicCourses.map((course) => (
							<TableRow key={course.id}>
								{columns.map((column) => (
									<TableCell
										key={String(column.accessorKey)}
										className={`py-2 ${
											column.accessorKey === "name"
												? "sticky left-0 z-10 bg-muted font-medium xl:static xl:bg-inherit"
												: ""
										}`}
									>
										{column.cell ? (
											column.cell(course)
										) : (
											<>{String(course[column.accessorKey])}</>
										)}
									</TableCell>
								))}
								<TableCell>
									<TeamLeaderCourseAssignmentCheckbox
										isAssigned={assignedCourseIds.has(course.id)}
										teamLeaderId={teamLeaderId}
										courseId={course.id}
									/>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
			{!areTherePublicCourses && (
				<div className="flex flex-col gap-4 justify-center items-center w-full">
					<p className="text-sm text-muted-foreground">
						No public courses available.
					</p>
					<Link to={href("/dashboard/courses")}>
						<PrimaryButton variant="outline">
							Go to Courses <ArrowRight className="h-4 w-4 ml-2" />
						</PrimaryButton>
					</Link>
				</div>
			)}
		</div>
	);
}

function TeamLeaderCourseAssignmentCheckbox({
	isAssigned,
	teamLeaderId,
	courseId,
}: {
	isAssigned: boolean;
	teamLeaderId: string;
	courseId: string;
}) {
	const fetcher = useFetcher();

	const form = useForm<AssignCourseShema>({
		resolver: zodResolver(assignCourseSchema),
		defaultValues: {
			isAssigned,
		},
	});

	return (
		<Form {...form}>
			<fetcher.Form
				action="/resource/course"
				method="POST"
				className="space-y-6"
			>
				<FormField
					control={form.control}
					name="isAssigned"
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<Checkbox
									checked={field.value}
									onCheckedChange={(checked) => {
										field.onChange(checked);
										fetcher.submit(
											{
												isAssigned: checked,
												studentId: teamLeaderId,
												courseId,
												intent: "update-course-assignment",
											},
											{
												action: "/resource/course",
												method: "POST",
											},
										);
									}}
								/>
							</FormControl>
						</FormItem>
					)}
				/>
			</fetcher.Form>
		</Form>
	);
}
