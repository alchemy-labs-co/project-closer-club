import { and, count, desc, eq, inArray, ne } from "drizzle-orm";
import { redirect } from "react-router";
import db from "~/db/index.server";
import {
	agentsTable,
	coursesTable,
	studentCoursesTable,
	user,
} from "~/db/schema";
import { isAdminLoggedIn } from "~/lib/auth/auth.server";

export async function GetAllStudents(request: Request) {
	const { isLoggedIn } = await isAdminLoggedIn(request);
	if (!isLoggedIn) {
		throw redirect("/admin/login");
	}
	try {
		// Get all agents, but filter out those who have been promoted to team leader
		const students = await db
			.select({
				id: agentsTable.id,
				studentId: agentsTable.studentId,
				name: agentsTable.name,
				email: agentsTable.email,
				phone: agentsTable.phone,
				isActivated: agentsTable.isActivated,
				teamLeaderId: agentsTable.teamLeaderId,
				createdAt: agentsTable.createdAt,
				updatedAt: agentsTable.updatedAt,
			})
			.from(agentsTable)
			.leftJoin(user, eq(agentsTable.studentId, user.id))
			.where(ne(user.role, "team_leader")) // Exclude promoted agents
			.orderBy(desc(agentsTable.createdAt));
		return { success: true, students };
	} catch (e) {
		console.error("🔴Error fetching students from database:", e);
		return { success: false, students: [] };
	}
}
export async function GetStudentsAnalytics(request: Request) {
	const { isLoggedIn } = await isAdminLoggedIn(request);
	if (!isLoggedIn) {
		throw redirect("/admin/login");
	}
	try {
		// Count only non-promoted agents
		const [totalStudentsCount] = await db
			.select({ count: count() })
			.from(agentsTable)
			.leftJoin(user, eq(agentsTable.studentId, user.id))
			.where(ne(user.role, "team_leader"));
		const [activeStudentsCount] = await db
			.select({ count: count() })
			.from(agentsTable)
			.leftJoin(user, eq(agentsTable.studentId, user.id))
			.where(
				and(eq(agentsTable.isActivated, true), ne(user.role, "team_leader")),
			);
		return {
			success: true,
			totalStudentsCount: totalStudentsCount.count,
			activeStudentsCount: activeStudentsCount.count,
			inactiveStudentsCount:
				totalStudentsCount.count - activeStudentsCount.count,
		};
	} catch (e) {
		console.error("🔴Error fetching students from database:", e);
		return {
			success: false,
			totalStudentsCount: 0,
			activeStudentsCount: 0,
			inactiveStudentsCount: 0,
		};
	}
}
export async function GetStudentById(request: Request, studentId: string) {
	const { isLoggedIn } = await isAdminLoggedIn(request);
	if (!isLoggedIn) {
		throw redirect("/admin/login");
	}
	try {
		const [result] = await db
			.select({
				id: agentsTable.id,
				studentId: agentsTable.studentId,
				name: agentsTable.name,
				email: agentsTable.email,
				phone: agentsTable.phone,
				isActivated: agentsTable.isActivated,
				teamLeaderId: agentsTable.teamLeaderId,
				createdAt: agentsTable.createdAt,
				updatedAt: agentsTable.updatedAt,
				userRole: user.role,
			})
			.from(agentsTable)
			.leftJoin(user, eq(agentsTable.studentId, user.id))
			.where(eq(agentsTable.studentId, studentId))
			.limit(1);

		if (!result) {
			return { success: false, student: null, isPromoted: false };
		}

		// Check if the user has been promoted to team leader
		const isPromoted = result.userRole === "team_leader";

		// Return the agent data with promotion status
		const student = {
			id: result.id,
			studentId: result.studentId,
			name: result.name,
			email: result.email,
			phone: result.phone,
			isActivated: result.isActivated,
			teamLeaderId: result.teamLeaderId,
			createdAt: result.createdAt,
			updatedAt: result.updatedAt,
		};

		return { success: true, student, isPromoted };
	} catch (e) {
		console.error("🔴Error fetching student from database:", e);
		return { success: false, student: null, isPromoted: false };
	}
}
export async function getCoursesStudentEnrolledIn(
	request: Request,
	studentId: string,
) {
	// auth check
	const { isLoggedIn, admin } = await isAdminLoggedIn(request);
	if (!isLoggedIn) {
		throw redirect("/login");
	}
	if (!admin) {
		console.error("Student not found");
		return { courses: [] };
	}
	try {
		const studentCourses = await db
			.select()
			.from(studentCoursesTable)
			.where(eq(studentCoursesTable.studentId, studentId));
		// find all the courses that the student is assigned to
		const courses = await db
			.select()
			.from(coursesTable)
			.where(
				and(
					eq(coursesTable.isPublic, true),
					inArray(
						coursesTable.id,
						studentCourses.map((course) => course.courseId),
					),
				),
			);

		return { courses };
	} catch (error) {
		console.error(
			`Error fetching student courses: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
		return { courses: [] };
	}
}

export async function getCoursesTeamLeaderEnrolledIn(
	request: Request,
	teamLeaderId: string,
) {
	// auth check
	const { isLoggedIn, admin } = await isAdminLoggedIn(request);
	if (!isLoggedIn) {
		throw redirect("/login");
	}
	if (!admin) {
		console.error("Admin not found");
		return { courses: [] };
	}
	try {
		const teamLeaderCourses = await db
			.select()
			.from(studentCoursesTable)
			.where(eq(studentCoursesTable.studentId, teamLeaderId));
		// find all the courses that the team leader is assigned to
		const courses = await db
			.select()
			.from(coursesTable)
			.where(
				and(
					eq(coursesTable.isPublic, true),
					inArray(
						coursesTable.id,
						teamLeaderCourses.map((course) => course.courseId),
					),
				),
			);

		return { courses };
	} catch (error) {
		console.error(
			`Error fetching team leader courses: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
		return { courses: [] };
	}
}
