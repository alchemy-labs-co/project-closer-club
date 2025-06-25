import { BookOpen } from "lucide-react";
import { Link, useNavigation } from "react-router";
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
import { getStudentCourses } from "~/lib/student/data-access/students.server";
import { cn } from "~/lib/utils";
import type { Route } from "./+types/_agent.student.courses";

export async function loader({ request }: Route.LoaderArgs) {
	// get all public courses for the student
	const { courses } = await getStudentCourses(request);
	return { courses };
}

export default function StudentCourses({ loaderData }: Route.ComponentProps) {
	const navigation = useNavigation();
	const isLoading = navigation.state !== "idle";
	const { courses } = loaderData;
	if (isLoading) {
		return <CourseCardSkeleton />;
	}
	return (
		<div className="max-w-7xl mx-auto pt-8 md:pt-12 lg:pt-20 pb-8 px-4 xl:px-0">
			<h1 className="text-center text-3xl font-bold mb-8">Available Courses</h1>

			{courses.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-gray-500 text-lg">
						No courses available at the moment.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{courses.map((course) => (
						<CourseCard key={course.id} course={course} />
					))}
				</div>
			)}
		</div>
	);
}

function CourseCard({ course }: { course: Course }) {
	const { name, description, slug, thumbnailUrl } = course;

	return (
		<Card
			className={cn(
				"flex flex-col h-full transition-all duration-300 hover:shadow-lg hover:border-brand-primary/30",
				thumbnailUrl && "pt-0"
			)}
		>
			{thumbnailUrl && (
				<div className="p-0">
					<img
						src={thumbnailUrl}
						alt={`${name} thumbnail`}
						className="w-full h-48 object-cover rounded-t-lg"
					/>
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
				<CardTitle className="text-xl">{name}</CardTitle>
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
