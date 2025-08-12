import { and, count, eq } from "drizzle-orm";
import { redirect } from "react-router";
import db from "~/db/index.server";
import {
	completedQuizAssignmentsTable,
	coursesTable,
	lessonsTable,
	modulesTable,
	studentCoursesTable,
	quizzesTable,
	agentsTable,
	teamLeadersTable,
} from "~/db/schema";
import { isTeamLeaderLoggedIn } from "~/lib/auth/auth.server";

// Get quiz analytics for a specific course and student
async function getCourseQuizAnalytics(courseId: string, studentId: string) {
	try {
		// Get total quizzes in this course
		const [totalQuizzesResult] = await db
			.select({
				totalQuizzes: count(quizzesTable.id),
			})
			.from(quizzesTable)
			.leftJoin(lessonsTable, eq(quizzesTable.lessonId, lessonsTable.id))
			.leftJoin(modulesTable, eq(lessonsTable.moduleId, modulesTable.id))
			.where(eq(modulesTable.courseId, courseId));

		// Get completed quiz assignments for this student in this course
		const completedQuizData = await db
			.select({
				id: completedQuizAssignmentsTable.id,
				numberOfQuestions: completedQuizAssignmentsTable.numberOfQuestions,
				totalCorrectAnswers: completedQuizAssignmentsTable.totalCorrectAnswers,
			})
			.from(completedQuizAssignmentsTable)
			.leftJoin(
				lessonsTable,
				eq(completedQuizAssignmentsTable.lessonId, lessonsTable.id),
			)
			.leftJoin(modulesTable, eq(lessonsTable.moduleId, modulesTable.id))
			.where(
				and(
					eq(modulesTable.courseId, courseId),
					eq(completedQuizAssignmentsTable.studentId, studentId),
				),
			);

		const totalQuizzes = totalQuizzesResult?.totalQuizzes || 0;
		const completedQuizzes = completedQuizData.length;
		const quizCompletionPercentage =
			totalQuizzes > 0
				? Math.round((completedQuizzes / totalQuizzes) * 100)
				: 0;

		// Calculate quiz score analytics
		const totalQuestionsAnswered = completedQuizData.reduce(
			(sum, quiz) => sum + quiz.numberOfQuestions,
			0,
		);
		const totalCorrectAnswers = completedQuizData.reduce(
			(sum, quiz) => sum + quiz.totalCorrectAnswers,
			0,
		);
		const overallAccuracy =
			totalQuestionsAnswered > 0
				? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100)
				: 0;

		// Calculate average quiz score (percentage)
		const quizScores = completedQuizData.map((quiz) =>
			quiz.numberOfQuestions > 0
				? (quiz.totalCorrectAnswers / quiz.numberOfQuestions) * 100
				: 0,
		);
		const averageQuizScore =
			quizScores.length > 0
				? Math.round(
						quizScores.reduce((sum, score) => sum + score, 0) /
							quizScores.length,
					)
				: 0;

		return {
			totalQuizzes,
			completedQuizzes,
			quizCompletionPercentage,
			averageQuizScore,
			totalQuestionsAnswered,
			totalCorrectAnswers,
			overallAccuracy,
		};
	} catch (error) {
		console.error("Error fetching quiz analytics:", error);
		return {
			totalQuizzes: 0,
			completedQuizzes: 0,
			quizCompletionPercentage: 0,
			averageQuizScore: 0,
			totalQuestionsAnswered: 0,
			totalCorrectAnswers: 0,
			overallAccuracy: 0,
		};
	}
}

// Get a specific agent's progress across all their assigned courses
async function getAgentCoursesProgress(studentId: string) {
	try {
		// Get all courses the agent is enrolled in
		const enrolledCourses = await db
			.select({
				courseId: coursesTable.id,
				courseName: coursesTable.name,
				courseDescription: coursesTable.description,
				courseThumbnailUrl: coursesTable.thumbnailUrl,
				courseSlug: coursesTable.slug,
			})
			.from(studentCoursesTable)
			.leftJoin(coursesTable, eq(studentCoursesTable.courseId, coursesTable.id))
			.where(eq(studentCoursesTable.studentId, studentId));

		// Calculate progress for each course
		const coursesWithProgress = await Promise.all(
			enrolledCourses.map(async (course) => {
				if (!course.courseId) return null;

				// Get total lessons in this course
				const [totalLessonsResult] = await db
					.select({
						totalLessons: count(lessonsTable.id),
					})
					.from(lessonsTable)
					.leftJoin(modulesTable, eq(lessonsTable.moduleId, modulesTable.id))
					.where(eq(modulesTable.courseId, course.courseId));

				// Get completed lessons for this specific agent in this course
				const [completedLessonsResult] = await db
					.select({
						completedLessons: count(completedQuizAssignmentsTable.id),
					})
					.from(completedQuizAssignmentsTable)
					.leftJoin(
						lessonsTable,
						eq(completedQuizAssignmentsTable.lessonId, lessonsTable.id),
					)
					.leftJoin(modulesTable, eq(lessonsTable.moduleId, modulesTable.id))
					.where(
						and(
							eq(modulesTable.courseId, course.courseId),
							eq(completedQuizAssignmentsTable.studentId, studentId),
						),
					);

				const totalLessons = totalLessonsResult?.totalLessons || 0;
				const completedLessons = completedLessonsResult?.completedLessons || 0;
				const progressPercentage =
					totalLessons > 0
						? Math.round((completedLessons / totalLessons) * 100)
						: 0;

				// Get quiz analytics for this course
				const quizAnalytics = await getCourseQuizAnalytics(
					course.courseId,
					studentId,
				);

				return {
					id: course.courseId,
					name: course.courseName,
					description: course.courseDescription,
					thumbnailUrl: course.courseThumbnailUrl,
					slug: course.courseSlug,
					totalLessons,
					completedLessons,
					progressPercentage,
					...quizAnalytics,
				};
			}),
		);

		// Filter out any null results
		const validCoursesWithProgress = coursesWithProgress.filter(
			(course): course is NonNullable<typeof course> => course !== null,
		);

		// Calculate overall summary including quiz analytics
		const totalQuizzes = validCoursesWithProgress.reduce(
			(sum, course) => sum + course.totalQuizzes,
			0,
		);
		const totalCompletedQuizzes = validCoursesWithProgress.reduce(
			(sum, course) => sum + course.completedQuizzes,
			0,
		);
		const totalQuestionsAnswered = validCoursesWithProgress.reduce(
			(sum, course) => sum + course.totalQuestionsAnswered,
			0,
		);
		const totalCorrectAnswers = validCoursesWithProgress.reduce(
			(sum, course) => sum + course.totalCorrectAnswers,
			0,
		);

		const averageQuizCompletionRate =
			validCoursesWithProgress.length > 0
				? Math.round(
						validCoursesWithProgress.reduce(
							(sum, course) => sum + course.quizCompletionPercentage,
							0,
						) / validCoursesWithProgress.length,
					)
				: 0;

		const overallAverageQuizScore =
			validCoursesWithProgress.length > 0
				? Math.round(
						validCoursesWithProgress.reduce(
							(sum, course) => sum + course.averageQuizScore,
							0,
						) / validCoursesWithProgress.length,
					)
				: 0;

		const overallAccuracy =
			totalQuestionsAnswered > 0
				? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100)
				: 0;

		return {
			success: true,
			studentId,
			courses: validCoursesWithProgress,
			summary: {
				totalEnrolledCourses: validCoursesWithProgress.length,
				averageProgress:
					validCoursesWithProgress.length > 0
						? Math.round(
								validCoursesWithProgress.reduce(
									(sum, course) => sum + course.progressPercentage,
									0,
								) / validCoursesWithProgress.length,
							)
						: 0,
				totalLessons: validCoursesWithProgress.reduce(
					(sum, course) => sum + course.totalLessons,
					0,
				),
				totalCompletedLessons: validCoursesWithProgress.reduce(
					(sum, course) => sum + course.completedLessons,
					0,
				),
				totalQuizzes,
				totalCompletedQuizzes,
				averageQuizCompletionRate,
				overallAverageQuizScore,
				totalQuestionsAnswered,
				totalCorrectAnswers,
				overallAccuracy,
			},
		};
	} catch (error) {
		console.error("Error fetching agent courses progress:", error);
		return {
			success: false,
			studentId,
			courses: [],
			summary: {
				totalEnrolledCourses: 0,
				averageProgress: 0,
				totalLessons: 0,
				totalCompletedLessons: 0,
				totalQuizzes: 0,
				totalCompletedQuizzes: 0,
				averageQuizCompletionRate: 0,
				overallAverageQuizScore: 0,
				totalQuestionsAnswered: 0,
				totalCorrectAnswers: 0,
				overallAccuracy: 0,
			},
		};
	}
}

export type TeamLeaderAnalytics = {
	teamOverview: {
		totalAgents: number;
		activeAgents: number;
		totalCourses: number;
		averageProgress: number;
	};
	agentAnalytics: {
		success: boolean;
		teamLeaderId: string;
		agents: {
			id: string;
			name: string;
			email: string;
			studentId: string;
			isActivated: boolean;
			courses: {
				id: string;
				name: string | null;
				description: string | null;
				thumbnailUrl: string | null;
				slug: string | null;
				totalLessons: number;
				completedLessons: number;
				progressPercentage: number;
				totalQuizzes: number;
				completedQuizzes: number;
				quizCompletionPercentage: number;
				averageQuizScore: number;
				totalQuestionsAnswered: number;
				totalCorrectAnswers: number;
				overallAccuracy: number;
			}[];
			summary: {
				totalEnrolledCourses: number;
				averageProgress: number;
				totalLessons: number;
				totalCompletedLessons: number;
				totalQuizzes: number;
				totalCompletedQuizzes: number;
				averageQuizCompletionRate: number;
				overallAverageQuizScore: number;
				totalQuestionsAnswered: number;
				totalCorrectAnswers: number;
				overallAccuracy: number;
			};
		}[];
	};
};

// Get analytics for all agents under a team leader
export async function getTeamLeaderAnalytics(
	request: Request,
): Promise<TeamLeaderAnalytics> {
	const { isLoggedIn, teamLeader } = await isTeamLeaderLoggedIn(request);
	if (!isLoggedIn || !teamLeader) {
		throw redirect("/team-leader/login");
	}

	try {
		// Get the team leader's database record
		const [leader] = await db
			.select()
			.from(teamLeadersTable)
			.where(eq(teamLeadersTable.teamLeaderId, teamLeader.id))
			.limit(1);

		if (!leader) {
			throw new Error("Team leader not found");
		}

		// Get all agents assigned to this team leader
		const agents = await db
			.select()
			.from(agentsTable)
			.where(eq(agentsTable.teamLeaderId, leader.id));

		// Get analytics for each agent
		const agentAnalytics = await Promise.all(
			agents.map(async (agent) => {
				const coursesProgress = await getAgentCoursesProgress(agent.studentId);
				return {
					id: agent.id,
					name: agent.name,
					email: agent.email,
					studentId: agent.studentId,
					isActivated: agent.isActivated,
					courses: coursesProgress.courses,
					summary: coursesProgress.summary,
				};
			}),
		);

		// Calculate team overview metrics
		const activeAgents = agents.filter((agent) => agent.isActivated).length;
		const allCourses = agentAnalytics.flatMap((agent) => agent.courses);
		const uniqueCourseIds = new Set(allCourses.map((course) => course.id));
		const totalCourses = uniqueCourseIds.size;

		const totalProgress = agentAnalytics.reduce(
			(sum, agent) => sum + agent.summary.averageProgress,
			0,
		);
		const averageProgress =
			agentAnalytics.length > 0
				? Math.round(totalProgress / agentAnalytics.length)
				: 0;

		return {
			teamOverview: {
				totalAgents: agents.length,
				activeAgents,
				totalCourses,
				averageProgress,
			},
			agentAnalytics: {
				success: true,
				teamLeaderId: leader.id,
				agents: agentAnalytics,
			},
		};
	} catch (error) {
		console.error("Error fetching team leader analytics:", error);
		return {
			teamOverview: {
				totalAgents: 0,
				activeAgents: 0,
				totalCourses: 0,
				averageProgress: 0,
			},
			agentAnalytics: {
				success: false,
				teamLeaderId: teamLeader.id,
				agents: [],
			},
		};
	}
}
