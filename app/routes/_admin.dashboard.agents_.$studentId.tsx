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
import { ActivateStudent } from "~/components/features/students/activate-student";
import { DeactivateStudent } from "~/components/features/students/deactivate-student";
import { PromoteToTeamLeader } from "~/components/features/students/promote-to-team-leader";
import { StatusBadge } from "~/components/features/students/status-badge";
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
import type { Course, TeamLeader } from "~/db/schema";
import { getAllPublicCourses } from "~/lib/admin/data-access/courses.server";
import {
	GetStudentById,
	getCoursesStudentEnrolledIn,
} from "~/lib/admin/data-access/students.server";
import {
	GetAllTeamLeaders,
	getTeamLeaderAssignedToAgent,
} from "~/lib/admin/data-access/team-leader/team-leaders.server";
import { formatDateToString } from "~/lib/utils";
import {
	type AssignCourseShema,
	assignCourseSchema,
} from "~/lib/zod-schemas/course";
import type { Route } from "./+types/_admin.dashboard.agents_.$studentId";

export async function loader({ request, params }: Route.LoaderArgs) {
	const { studentId } = params;

	const publicCourses = getAllPublicCourses(request);
	const coursesStudentAssignedTo = getCoursesStudentEnrolledIn(
		request,
		studentId,
	);
	const allTeamLeaders = GetAllTeamLeaders(request);
	const teamLeaderAssignedToAgent = getTeamLeaderAssignedToAgent(
		request,
		studentId,
	);
	const { success, student } = await GetStudentById(
		request,
		studentId as string,
	);
	if (!success || !student) {
		throw redirect("/dashboard/agents");
	}
	// non critical data

	return data(
		{
			success: true,
			student,
			courses: publicCourses,
			coursesStudentAssignedTo: coursesStudentAssignedTo,
			teamLeaders: allTeamLeaders,
			teamLeaderAssignedToAgent: teamLeaderAssignedToAgent,
		},
		{ status: 200 },
	);
}

function TeamLeadersAssignedToAgent() {
	const data = useLoaderData<typeof loader>();
	const studentId = data.student.studentId;
	const { teamLeaders: allTeamLeaders } = React.use(data.teamLeaders);
	const { teamLeader: assignedTeamLeader } = React.use(
		data.teamLeaderAssignedToAgent,
	);

	const columns: {
		header: string;
		accessorKey: keyof TeamLeader;
		cell?: (teamLeader: TeamLeader) => React.ReactNode;
	}[] = [
		{ header: "Name", accessorKey: "name" },
		{ header: "Email", accessorKey: "email" },
		{ header: "Phone", accessorKey: "phone" },
		{
			header: "Status",
			accessorKey: "isActivated",
			cell: (teamLeader) => <StatusBadge status={teamLeader.isActivated} />,
		},
	];

	const areThereTeamLeaders = allTeamLeaders.length > 0;

	return (
		<div className="flex flex-col gap-4 md:gap-6">
			<h3 className="text-xl md:text-3xl font-medium">
				Team Leader Assignment:
			</h3>
			{areThereTeamLeaders && (
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
						{allTeamLeaders.map((teamLeader) => (
							<TableRow key={teamLeader.id}>
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
											column.cell(teamLeader)
										) : (
											<>{String(teamLeader[column.accessorKey])}</>
										)}
									</TableCell>
								))}
								<TableCell>
									<AgentTeamLeaderAssignmentCheckbox
										isAssigned={
											assignedTeamLeader?.teamLeaderId ===
											teamLeader.teamLeaderId
										}
										studentId={studentId}
										teamLeaderId={teamLeader.teamLeaderId}
									/>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
			{!areThereTeamLeaders && (
				<div className="flex flex-col gap-4 justify-center items-center w-full">
					<p className="text-sm text-muted-foreground">
						No team leaders available.
					</p>
					<Link to={href("/dashboard/team-leaders")}>
						<PrimaryButton variant="outline">
							Go to Team Leaders <ArrowRight className="h-4 w-4 ml-2" />
						</PrimaryButton>
					</Link>
				</div>
			)}
		</div>
	);
}

function AgentTeamLeaderAssignmentCheckbox({
	isAssigned,
	studentId,
	teamLeaderId,
}: {
	isAssigned: boolean;
	studentId: string;
	teamLeaderId: string;
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
												studentId,
												teamLeaderId,
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

export default function StudentProfilePage() {
	return (
		<div className="flex flex-col gap-6 py-4">
			<div className="flex items-center gap-2">
				<Button variant="ghost" size="sm" asChild>
					<Link to="/dashboard/agents">
						<ArrowLeft className="h-4 w-4 mr-1" />
						Back to Agents
					</Link>
				</Button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<StudentInfoMainCard />
				<StudentStatusCard />
				<Suspense fallback={<p>loading...</p>}>
					<CoursesStudentAssignedTo />
				</Suspense>
			</div>

			<Suspense fallback={<p>loading...</p>}>
				<TeamLeadersAssignedToAgent />
			</Suspense>
		</div>
	);
}

function StudentInfoMainCard() {
	const { student } = useLoaderData<typeof loader>();
	return (
		<Card className="col-span-3 md:col-span-2">
			<CardHeader>
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
					<div>
						<CardTitle className="text-2xl">{student.name}</CardTitle>
						<CardDescription className="text-base">
							{student.email}
						</CardDescription>
					</div>
					<div className="flex items-center gap-2">
						<StatusBadge status={student.isActivated} />
						<Button variant="outline" size="sm" asChild>
							<Link to={`/dashboard/agents/${student.studentId}/edit`}>
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
							<p className="text-base">{student.name}</p>
						</div>
					</div>
					<div className="flex items-start gap-3">
						<div className="bg-primary/10 p-2 rounded-full">
							<Mail className="h-5 w-5 text-primary" />
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">Email</p>
							<p className="text-base">{student.email}</p>
						</div>
					</div>
					<div className="flex items-start gap-3">
						<div className="bg-primary/10 p-2 rounded-full">
							<Phone className="h-5 w-5 text-primary" />
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">Phone</p>
							<p className="text-base">{student.phone || "Not provided"}</p>
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
								{formatDateToString(new Date(student.createdAt))}
							</p>
						</div>
					</div>
				</div>
			</CardContent>
			<CardFooter className="flex justify-end gap-2">
				{student.isActivated && (
					<PromoteToTeamLeader 
						studentId={student.studentId}
						studentName={student.name}
					/>
				)}
				{student.isActivated ? (
					<DeactivateStudent studentId={student.studentId} />
				) : (
					<ActivateStudent studentId={student.studentId} />
				)}
			</CardFooter>
		</Card>
	);
}

function StudentStatusCard() {
	const { student } = useLoaderData<typeof loader>();
	return (
		<Card className="col-span-3 md:col-span-1">
			<CardHeader>
				<CardTitle>Account Status</CardTitle>
				<CardDescription>Manage student account access</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<span className="text-sm font-medium">Account Status</span>
						<StatusBadge status={student.isActivated} />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function CoursesStudentAssignedTo() {
	const data = useLoaderData<typeof loader>();
	const studentId = data.student.studentId;
	const { courses: allPublicCourses } = React.use(data.courses);
	const { courses: coursesStudentAssignedTo } = React.use(
		data.coursesStudentAssignedTo,
	);
	const assignedCourseIds = new Set(
		coursesStudentAssignedTo.map((course) => course.id),
	);
	const columns: {
		header: string;
		accessorKey: keyof Course;
		cell?: (course: Course) => React.ReactNode;
	}[] = [
		{ header: "Name", accessorKey: "name" },
		{ header: "Description", accessorKey: "description" },
		// { header: 'Published', accessorKey: 'isPublic',   cell: (course) => (
		//     <StatusBadge status={course.isPublic} />
		//   ), },
	];

	const areTherePublicCourses = allPublicCourses.length > 0;

	return (
		<div className="col-span-3 flex flex-col gap-4 md:gap-6">
			<h3 className="text-xl md:text-3xl font-medium">
				Courses student is assigned to:
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
									<StudentCourseAssigmentCheckbox
										isAssigned={assignedCourseIds.has(course.id)}
										studentId={studentId}
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

function StudentCourseAssigmentCheckbox({
	isAssigned,
	studentId,
	courseId,
}: {
	isAssigned: boolean;
	studentId: string;
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
												studentId,
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
