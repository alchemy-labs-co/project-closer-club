import { BookOpen } from "lucide-react";
import React, { Suspense } from "react";
import { Link, useNavigation, redirect } from "react-router";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";

import { CourseCardSkeleton } from "~/components/global/student/student-skeleton";
import type { Course } from "~/db/schema";
import { isAgentLoggedIn } from "~/lib/auth/auth.server";
import { getCompletedLessonsCount } from "~/lib/student/data-access/assignments.server";
import { getTotalLessonsCount } from "~/lib/student/data-access/courses.server";
import { getStudentCourses } from "~/lib/student/data-access/students.server";
import { cn } from "~/lib/utils";
import type { Route } from "./+types/_agent.student.courses";
import { Skeleton } from "~/components/ui/skeleton";

export async function loader({ request }: Route.LoaderArgs) {
	// get auth info to get student ID
	const { isLoggedIn, student } = await isAgentLoggedIn(request);
	if (!isLoggedIn || !student) {
		throw redirect("/login");
	}

	// get all public courses for the student
	const { courses } = await getStudentCourses(request);

	// Create progress promises for each course
	const coursesWithProgress = courses.map((course) => ({
		...course,
		progressPromise: (async () => {
			const totalLessons = await getTotalLessonsCount(request, course.id);
			const completedLessons = await getCompletedLessonsCount(
				request,
				course.id
			);
			return { totalLessons, completedLessons };
		})(),
	}));

	return { coursesWithProgress };
}

export default function StudentCourses({ loaderData }: Route.ComponentProps) {
	const navigation = useNavigation();
	const isLoading = navigation.state !== "idle";
	const { coursesWithProgress } = loaderData;
	if (isLoading) {
		return <CourseCardSkeleton />;
	}
	return (
		<div className="max-w-7xl mx-auto pt-8 md:pt-12 lg:pt-20 pb-8 px-4 xl:px-0">
			<h1 className="text-center text-3xl font-bold mb-8">Available Courses</h1>

			{coursesWithProgress.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-gray-500 text-lg">
						No courses available at the moment.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{coursesWithProgress.map((course) => (
						<CourseCard key={course.id} course={course} />
					))}
				</div>
			)}
		</div>
	);
}

function CourseCard({
	course,
}: {
	course: Course & {
		progressPromise: Promise<{
			totalLessons: number;
			completedLessons: number;
		}>;
	};
}) {
	const { name, description, slug, thumbnailUrl } = course;

	return (
		<Card
			className={cn(
				"flex flex-col h-full transition-all duration-300 hover:shadow-lg hover:border-brand-primary/30",
				thumbnailUrl && "pt-0"
			)}
		>
			{thumbnailUrl && (
				<div className="p-0 relative">
					<img
						src={thumbnailUrl}
						alt={`${name} thumbnail`}
						className="w-full h-48 object-cover rounded-t-lg"
					/>
					{/* Dark overlay */}
					<div className="absolute inset-0 bg-black/20 rounded-t-lg" />
					{/* Progress Circle - positioned over the thumbnail overlay */}
					<div className="absolute top-3 right-3 z-10">
						<Suspense fallback={<ProgressCircleFallback />}>
							<ProgressCircle progressPromise={course.progressPromise} />
						</Suspense>
					</div>
				</div>
			)}

			{/* Progress Bar below thumbnail */}
			{thumbnailUrl && (
				<div className="px-4 pt-3">
					<Suspense fallback={<ProgressBarFallback />}>
						<ProgressBar progressPromise={course.progressPromise} />
					</Suspense>
				</div>
			)}

			{/* Progress Circle for courses without thumbnails */}
			{!thumbnailUrl && (
				<div className="absolute top-3 right-3 z-10">
					<Suspense fallback={<ProgressCircleFallback />}>
						<ProgressCircle progressPromise={course.progressPromise} />
					</Suspense>
				</div>
			)}
			<CardHeader>
				{!thumbnailUrl && (
					<div className="flex items-center gap-2 mb-2">
						<div className="bg-brand-primary/10 p-2 rounded-full">
							<BookOpen className="h-5 w-5 text-brand-primary" />
						</div>
					</div>
				)}
				<CardTitle className="text-xl pr-12">{name}</CardTitle>
			</CardHeader>
			<CardContent className="flex-grow">
				<CardDescription className="text-base">{description}</CardDescription>
			</CardContent>
			<CardFooter>
				<Button
					asChild
					className="w-full bg-brand-primary hover:bg-brand-primary/90"
				>
					<Link to={`/student/courses/${slug}`}>View Course</Link>
				</Button>
			</CardFooter>
		</Card>
	);
}

function ProgressCircle({
	progressPromise,
}: {
	progressPromise: Promise<{ totalLessons: number; completedLessons: number }>;
}) {
	const { totalLessons, completedLessons } = React.use(progressPromise);

	const progressPercentage =
		totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
	const circumference = 2 * Math.PI * 16; // radius of 16
	const strokeDashoffset =
		circumference - (progressPercentage / 100) * circumference;

	return (
		<div className="relative w-10 h-10">
			<svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 40 40">
				{/* Background circle */}
				<circle
					cx="20"
					cy="20"
					r="16"
					fill="transparent"
					stroke="rgba(209, 213, 219, 0.3)"
					strokeWidth="3"
				/>
				{/* Progress circle */}
				<circle
					cx="20"
					cy="20"
					r="16"
					fill="transparent"
					stroke="rgb(59, 130, 246)"
					strokeWidth="3"
					strokeDasharray={circumference}
					strokeDashoffset={strokeDashoffset}
					strokeLinecap="round"
					className="transition-all duration-300 ease-in-out"
				/>
			</svg>
			{/* Percentage text */}
			<div className="absolute inset-0 flex items-center justify-center">
				<span className="text-xs font-semibold text-white">
					{Math.round(progressPercentage)}%
				</span>
			</div>
		</div>
	);
}

function ProgressCircleFallback() {
	return <Skeleton className="relative w-10 h-10 rounded-full" />;
}

function ProgressBar({
	progressPromise,
}: {
	progressPromise: Promise<{ totalLessons: number; completedLessons: number }>;
}) {
	const { totalLessons, completedLessons } = React.use(progressPromise);

	const progressPercentage =
		totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

	return (
		<div className="w-full">
			<div className="flex justify-between items-center mb-1">
				<span className="text-sm text-gray-600">Progress</span>
				<span className="text-sm font-medium text-gray-900">
					{completedLessons}/{totalLessons} lessons
				</span>
			</div>
			<div className="w-full bg-gray-200 rounded-full h-2">
				<div
					className="bg-brand-primary h-2 rounded-full transition-all duration-300 ease-in-out"
					style={{ width: `${progressPercentage}%` }}
				/>
			</div>
		</div>
	);
}

function ProgressBarFallback() {
	return (
		<div className="w-full">
			<div className="flex justify-between items-center mb-1">
				<Skeleton className="h-4 w-16" />
				<Skeleton className="h-4 w-20" />
			</div>
			<Skeleton className="w-full h-2 rounded-full" />
		</div>
	);
}
