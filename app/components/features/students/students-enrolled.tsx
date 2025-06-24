import { useEffect } from "react";
import { useFetcher } from "react-router";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import type { Student, TeamLeader, Course } from "~/db/schema";

type FetcherResponse = {
	success: boolean;
	students: Student[];
	teamLeaders: TeamLeader[];
	course?: Course;
	error?: string;
};

function AgentsList({ students }: { students: Student[] }) {
	if (students.length === 0) {
		return (
			<div className="flex flex-col gap-2">
				<p className="text-sm font-semibold text-muted-foreground underline">
					Students
				</p>
				<p className="text-sm text-muted-foreground italic">
					No students enrolled
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			<p className="text-sm font-semibold text-muted-foreground underline">
				Students ({students.length})
			</p>
			<div className="flex flex-col gap-2">
				{students.map((student) => (
					<div key={student.id} className="flex flex-col gap-2">
						<p className="text-sm text-muted-foreground">{student.name}</p>
					</div>
				))}
			</div>
		</div>
	);
}

function TeamLeadersList({ teamLeaders }: { teamLeaders: TeamLeader[] }) {
	if (teamLeaders.length === 0) {
		return (
			<div className="flex flex-col gap-2">
				<p className="text-sm font-semibold text-muted-foreground underline">
					Team Leaders
				</p>
				<p className="text-sm text-muted-foreground italic">
					No team leaders enrolled
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			<p className="text-sm font-semibold text-muted-foreground underline">
				Team Leaders ({teamLeaders.length})
			</p>
			<div className="flex flex-col gap-2">
				{teamLeaders.map((teamLeader) => (
					<div key={teamLeader.id} className="flex flex-col gap-2">
						<p className="text-sm text-muted-foreground">{teamLeader.name}</p>
					</div>
				))}
			</div>
		</div>
	);
}

export function StudentEnrolledList({ courseSlug }: { courseSlug: string }) {
	const fetcher = useFetcher<FetcherResponse>();

	// Load data only once when component mounts or courseSlug changes
	useEffect(() => {
		// Only fetch if we don't have data yet or if it's not currently loading
		if (fetcher.state === "idle" && !fetcher.data) {
			fetcher.load(`/resource/student-list/${courseSlug}`);
		}
	}, [courseSlug, fetcher]);

	const isLoading = fetcher.state === "loading";
	const data = fetcher.data;
	const hasError = data && !data.success;

	// Calculate total enrolled count for the button text
	const totalEnrolled = data
		? (data.students?.length || 0) + (data.teamLeaders?.length || 0)
		: 0;
	const buttonText = isLoading
		? "Loading..."
		: `See enrolled (${totalEnrolled})`;

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant={"link"} disabled={isLoading}>
					{buttonText}
				</Button>
			</DialogTrigger>
			<DialogContent className="flex flex-col gap-8 overflow-hidden">
				<DialogHeader>
					<DialogTitle className="text-xl font-bold underline decoration-2 underline-offset-4">
						Enrolled Students & Team Leaders
					</DialogTitle>
				</DialogHeader>

				{isLoading && (
					<div className="flex items-center justify-center py-8">
						<p className="text-muted-foreground">Loading student list...</p>
					</div>
				)}

				{hasError && (
					<div className="flex items-center justify-center py-8">
						<p className="text-destructive">
							{data?.error || "Failed to load student list"}
						</p>
					</div>
				)}

				{!isLoading && !hasError && data && (
					<div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-4">
						<AgentsList students={data.students || []} />
						<TeamLeadersList teamLeaders={data.teamLeaders || []} />

						{totalEnrolled === 0 && (
							<div className="text-center py-8">
								<p className="text-muted-foreground italic">
									No students or team leaders enrolled in this course yet.
								</p>
							</div>
						)}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
