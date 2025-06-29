import { ArrowLeft, Calendar, Mail, Phone, User, BookOpen } from "lucide-react";
import React, { Suspense } from "react";
import { Link, data, redirect } from "react-router";
import { StatusBadge } from "~/components/features/students/status-badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import type { Course } from "~/db/schema";
import {
	getAgent,
	getAgentCourses,
} from "~/lib/team-leaders/data-access/agents.server";
import { formatDateToString } from "~/lib/utils";
import type { Route } from "./+types/_team.team.agents_.$studentId";

export async function loader({ request, params }: Route.LoaderArgs) {
	const { studentId } = params;

	if (!studentId) {
		throw redirect("/team/agents");
	}

	// Get agent details and courses in parallel
	const [agentResponse, coursesResponse] = await Promise.all([
		getAgent(request, studentId),
		getAgentCourses(request, studentId),
	]);

	// Destructure the response data properly
	const { data: agentData } = agentResponse;
	const { data: coursesData } = coursesResponse;

	if (!agentData.success || !agentData.data) {
		throw redirect("/team/agents");
	}

	return data(
		{
			success: true,
			agent: agentData.data,
			agentCourses: coursesData.success ? coursesData.data : [],
		},
		{ status: 200 },
	);
}

function AgentInfoMainCard({ agent }: { agent: any }) {
	return (
		<Card className="col-span-3 md:col-span-2">
			<CardHeader>
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
					<div>
						<CardTitle className="text-2xl">{agent.name}</CardTitle>
						<CardDescription className="text-base">
							{agent.email}
						</CardDescription>
					</div>
					<div className="flex items-center gap-2">
						<StatusBadge status={agent.isActivated} />
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
							<p className="text-base">{agent.name}</p>
						</div>
					</div>
					<div className="flex items-start gap-3">
						<div className="bg-primary/10 p-2 rounded-full">
							<Mail className="h-5 w-5 text-primary" />
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">Email</p>
							<p className="text-base">{agent.email}</p>
						</div>
					</div>
					<div className="flex items-start gap-3">
						<div className="bg-primary/10 p-2 rounded-full">
							<Phone className="h-5 w-5 text-primary" />
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">Phone</p>
							<p className="text-base">{agent.phone || "Not provided"}</p>
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
								{formatDateToString(new Date(agent.createdAt))}
							</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function AgentStatusCard({ agent }: { agent: any }) {
	return (
		<Card className="col-span-3 md:col-span-1">
			<CardHeader>
				<CardTitle>Account Status</CardTitle>
				<CardDescription>Current agent account status</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<span className="text-sm font-medium">Account Status</span>
						<StatusBadge status={agent.isActivated} />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function CoursesAgentAssignedTo({ courses }: { courses: Course[] }) {
	const columns: {
		header: string;
		accessorKey: keyof Course;
		cell?: (course: Course) => React.ReactNode;
	}[] = [
		{
			header: "Course Name",
			accessorKey: "name",
			cell: (course) => <span className="font-medium">{course.name}</span>,
		},
		{
			header: "Description",
			accessorKey: "description",
			cell: (course) => (
				<div className="max-w-md">
					<p className="text-sm text-muted-foreground line-clamp-2">
						{course.description}
					</p>
				</div>
			),
		},
	];

	const hasActiveCourses = courses.length > 0;

	return (
		<div className="col-span-3 flex flex-col gap-4 md:gap-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<BookOpen className="h-5 w-5 text-primary" />
					<h3 className="text-xl md:text-2xl font-medium">Assigned Courses</h3>
				</div>
				<div className="text-sm text-muted-foreground">
					Total: {courses.length} courses
				</div>
			</div>

			{hasActiveCourses ? (
				<Card>
					<CardContent className="p-0">
						<div className="rounded-lg border-0 overflow-hidden">
							<Table>
								<TableHeader>
									<TableRow className="bg-muted/50">
										{columns.map((column) => (
											<TableHead
												key={String(column.accessorKey)}
												className="h-9 py-2 font-semibold"
											>
												{column.header}
											</TableHead>
										))}
									</TableRow>
								</TableHeader>
								<TableBody>
									{courses.map((course) => (
										<TableRow
											key={course.id}
											className="hover:bg-muted/30 transition-colors"
										>
											{columns.map((column) => (
												<TableCell
													key={String(column.accessorKey)}
													className="py-4"
												>
													{column.cell ? (
														column.cell(course)
													) : (
														<>{String(course[column.accessorKey])}</>
													)}
												</TableCell>
											))}
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-16">
						<div className="flex flex-col items-center text-center max-w-md">
							<div className="bg-muted/50 p-4 rounded-full mb-4">
								<BookOpen className="h-8 w-8 text-muted-foreground" />
							</div>
							<h4 className="text-lg font-medium text-muted-foreground mb-2">
								No Courses Assigned
							</h4>
							<p className="text-muted-foreground text-center">
								This agent is not enrolled in any courses yet.
							</p>
							<p className="text-sm text-muted-foreground text-center mt-2">
								Contact an administrator to assign courses to this agent.
							</p>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

export default function TeamAgentProfilePage({
	loaderData,
}: Route.ComponentProps) {
	const { agent, agentCourses } = loaderData;

	return (
		<div className="flex flex-col gap-6 py-4">
			<div className="flex items-center gap-2">
				<Button variant="ghost" size="sm" asChild>
					<Link to="/team/agents">
						<ArrowLeft className="h-4 w-4 mr-1" />
						Back to Agents
					</Link>
				</Button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<AgentInfoMainCard agent={agent} />
				<AgentStatusCard agent={agent} />
			</div>

			<Suspense fallback={<p>Loading courses...</p>}>
				<CoursesAgentAssignedTo courses={agentCourses} />
			</Suspense>
		</div>
	);
}
