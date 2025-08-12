import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
	BookOpen,
	CheckCircle,
	TrendingUp,
	Users,
	Target,
	Brain,
} from "lucide-react";

interface Course {
	id: string;
	name: string | null;
	description: string | null;
	thumbnailUrl: string | null;
	slug: string | null;
	totalLessons: number;
	completedLessons: number;
	progressPercentage: number;
	// Quiz analytics
	totalQuizzes: number;
	completedQuizzes: number;
	quizCompletionPercentage: number;
	averageQuizScore: number;
	totalQuestionsAnswered: number;
	totalCorrectAnswers: number;
	overallAccuracy: number;
}

interface Summary {
	totalEnrolledCourses: number;
	averageProgress: number;
	totalLessons: number;
	totalCompletedLessons: number;
	// Quiz summary
	totalQuizzes: number;
	totalCompletedQuizzes: number;
	averageQuizCompletionRate: number;
	overallAverageQuizScore: number;
	totalQuestionsAnswered: number;
	totalCorrectAnswers: number;
	overallAccuracy: number;
}

interface CourseCompletionAnalytics {
	success: boolean;
	studentId: string;
	courses: Course[];
	summary: Summary;
}

interface AgentAnalyticsDisplayProps {
	data: { courseCompletionAnalytics: CourseCompletionAnalytics };
}

export default function AgentAnalyticsDisplay({
	data,
}: AgentAnalyticsDisplayProps) {
	const { courseCompletionAnalytics } = data || {};

	if (!courseCompletionAnalytics || !courseCompletionAnalytics.success) {
		return (
			<div className="flex items-center justify-center p-8">
				<p className="text-muted-foreground">No analytics data available</p>
			</div>
		);
	}

	const { courses, summary } = courseCompletionAnalytics;

	return (
		<div className="space-y-6">
			{/* Course & Lesson Stats */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Enrolled Courses
						</CardTitle>
						<BookOpen className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{summary.totalEnrolledCourses}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Lesson Progress
						</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{summary.averageProgress}%</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Lessons Completed
						</CardTitle>
						<CheckCircle className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{summary.totalCompletedLessons}
						</div>
						<div className="text-xs text-muted-foreground">
							of {summary.totalLessons}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Quiz Performance Stats */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Quiz Completion
						</CardTitle>
						<Brain className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{summary.averageQuizCompletionRate}%
						</div>
						<div className="text-xs text-muted-foreground">
							{summary.totalCompletedQuizzes} of {summary.totalQuizzes} quizzes
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Average Score</CardTitle>
						<Target className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{summary.overallAverageQuizScore}%
						</div>
						<div className="text-xs text-muted-foreground">
							across all quizzes
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Answer Accuracy
						</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{summary.overallAccuracy}%</div>
						<div className="text-xs text-muted-foreground">
							{summary.totalCorrectAnswers} of {summary.totalQuestionsAnswered}{" "}
							correct
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Course Overview */}
			<Card>
				<CardHeader>
					<CardTitle>Enrolled Courses</CardTitle>
					<CardDescription>
						Overview of course progress and quiz performance
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{courses.map((course) => (
							<div
								key={course.id}
								className="flex items-center justify-between p-4 border rounded-lg"
							>
								<div className="flex items-center gap-3">
									{course.thumbnailUrl && (
										<img
											src={`https://${course.thumbnailUrl}`}
											alt={course.name || "Course thumbnail"}
											className="w-12 h-9 rounded object-cover"
										/>
									)}
									<div>
										<div className="font-medium text-sm">
											{course.name || "Untitled Course"}
										</div>
										<div className="text-xs text-muted-foreground space-y-1">
											<div>
												Lessons: {course.completedLessons}/{course.totalLessons}
											</div>
											<div>
												Quizzes: {course.completedQuizzes}/{course.totalQuizzes}
											</div>
										</div>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<div className="text-right">
										<div className="text-sm font-medium">
											Lessons: {course.progressPercentage}%
										</div>
										<div className="text-xs text-muted-foreground">
											Quizzes: {course.quizCompletionPercentage}%
										</div>
										<div className="text-xs text-muted-foreground">
											Avg Score: {course.averageQuizScore}%
										</div>
									</div>
									<div className="flex flex-col gap-1">
										<Badge
											variant={
												course.progressPercentage === 100
													? "default"
													: "secondary"
											}
											className="text-xs"
										>
											{course.progressPercentage === 100
												? "Lessons Done"
												: "In Progress"}
										</Badge>
										{course.completedQuizzes > 0 && (
											<Badge
												variant={
													course.averageQuizScore >= 80
														? "default"
														: "secondary"
												}
												className="text-xs"
											>
												{course.averageQuizScore >= 80
													? "Great Score"
													: "Improving"}
											</Badge>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
