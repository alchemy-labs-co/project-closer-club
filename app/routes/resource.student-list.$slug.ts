import { eq, inArray } from "drizzle-orm";
import { data } from "react-router";
import db from "~/db/index.server";
import {
	coursesTable,
	studentCoursesTable,
	agentsTable,
	teamLeadersTable,
} from "~/db/schema";
import { isAdminLoggedIn } from "~/lib/auth/auth.server";
import type { Route } from "./+types/resource.student-list.$slug";

export async function loader({ request, params }: Route.LoaderArgs) {
	// load all the courses in the database
	const { isLoggedIn } = await isAdminLoggedIn(request);
	if (!isLoggedIn) {
		return data("Not Allowed", { status: 405 });
	}
	const { slug } = params;
	if (!slug || typeof slug !== "string") {
		return data("Not Allowed", { status: 405 });
	}
	try {
		const [selectedCourse] = await db
			.select()
			.from(coursesTable)
			.where(eq(coursesTable.slug, slug))
			.limit(1);

		if (!selectedCourse) {
			return data({ students: [], teamLeaders: [] }, { status: 404 });
		}

		// Run database queries in parallel for better performance
		const [studentsInCourse, studentsList, teamLeadersList] = await Promise.all(
			[
				db
					.select()
					.from(studentCoursesTable)
					.where(eq(studentCoursesTable.courseId, selectedCourse.id)),
				// Get all students/agents that are enrolled in this course
				db
					.select({
						student: agentsTable,
						enrollment: studentCoursesTable,
					})
					.from(agentsTable)
					.innerJoin(
						studentCoursesTable,
						eq(agentsTable.studentId, studentCoursesTable.studentId),
					)
					.where(eq(studentCoursesTable.courseId, selectedCourse.id)),
				// Get all team leaders that are enrolled in this course
				db
					.select({
						teamLeader: teamLeadersTable,
						enrollment: studentCoursesTable,
					})
					.from(teamLeadersTable)
					.innerJoin(
						studentCoursesTable,
						eq(teamLeadersTable.teamLeaderId, studentCoursesTable.studentId),
					)
					.where(eq(studentCoursesTable.courseId, selectedCourse.id)),
			],
		);

		// Transform the data to match the expected format
		const students = studentsList.map((item) => item.student);
		const teamLeaders = teamLeadersList.map((item) => item.teamLeader);

		return {
			success: true,
			students,
			teamLeaders,
			course: selectedCourse,
		};
	} catch (error) {
		console.error("Error fetching students list:", error);
		return data(
			{
				success: false,
				students: [],
				teamLeaders: [],
				error: "Failed to fetch student list",
			},
			{ status: 500 },
		);
	}
}
