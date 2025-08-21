import { ChevronRight, CircleCheck, Lock, PlusIcon } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import type { Course } from "~/db/schema";
import { cn } from "~/lib/utils";
import { VideoPlayer } from "~/components/ui/video-thumbnail-player";
import { useCoursesLoaderData } from "~/routes/_admin.dashboard.courses";
import { DeleteCourse } from "./delete-course";
import { EditCourse } from "./edit-course";
import { MarkAsPrivate } from "./mark-as-private";
import { MarkAsPublic } from "./mark-as-public";
import { CreateCourse } from "./create-course";

export function CoursesList() {
	const { courses } = useCoursesLoaderData();

	if (courses.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center gap-10">
				<div>
					<div className="mb-4 text-gray-400">
						<PlusIcon className="w-16 h-16 mx-auto" />
					</div>
					<h3 className="text-xl font-semibold text-gray-600 mb-2">
						No courses yet
					</h3>
					<p className="text-gray-500 mb-6">
						It's a bit quiet here—start building your first course.
					</p>
					<CreateCourse />
				</div>
				<div className="flex flex-col items-center gap-4">
					<p className="text-gray-500">
						Not sure how to create a course? Watch our quick guide.
					</p>
					<VideoPlayer
						thumbnailUrl="/og-image.png"
						videoUrl="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
						title="Creating your first course"
						className="max-w-lg w-full"
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
			{courses.map((course) => (
				<CourseCard key={course.id} course={course} />
			))}
		</div>
	);
}
function CourseCard({ course }: { course: Course }) {
	const { id, name, description, isPublic, slug, thumbnailUrl } = course;
	return (
		<Card className={cn("relative", thumbnailUrl && "pt-0")}>
			{thumbnailUrl && (
				<div className="p-0">
					<img
						src={thumbnailUrl}
						alt={`${name} thumbnail`}
						className="w-full h-48 object-cover rounded-t-lg"
						crossOrigin="anonymous"
					/>
				</div>
			)}
			<CardHeader className="flex flex-row justify-between items-center">
				<CardTitle>
					<h3>{name}</h3>
				</CardTitle>

				{isPublic ? <IsPublicBadge /> : <IsPrivateBadge />}
			</CardHeader>

			<CardContent>
				<CardDescription>{description}</CardDescription>
			</CardContent>
			<CardFooter className="flex flex-row gap-4 items-center">
				<Button
					className="bg-brand-primary text-white hover:bg-brand-primary/60"
					asChild
				>
					<Link to={`/dashboard/courses/${slug}`}>
						View Course
						<ChevronRight className="w-4 h-4" />
					</Link>
				</Button>
				{!isPublic ? (
					<MarkAsPublic courseId={id} />
				) : (
					<MarkAsPrivate courseId={id} />
				)}
			</CardFooter>
			<div className="absolute -top-4 -right-0">
				<TooltipProvider>
					<Tooltip delayDuration={100}>
						<TooltipTrigger asChild>
							<div>
								<DeleteCourse courseId={id} />
							</div>
						</TooltipTrigger>
						<TooltipContent side="top">
							<p>Delete Course</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>
			<div className="absolute -top-4 right-12">
				<TooltipProvider>
					<Tooltip delayDuration={100}>
						<TooltipTrigger asChild>
							<div>
								<EditCourse
									name={name}
									description={description}
									courseId={id}
									slug={slug}
									thumbnailUrl={thumbnailUrl ?? undefined}
								/>
							</div>
						</TooltipTrigger>
						<TooltipContent side="top">
							<p>Edit Course</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>
		</Card>
	);
}
function IsPublicBadge() {
	return (
		<Badge className="flex bg-brand-primary flex-row items-center gap-1">
			<CircleCheck className="w-4 h-4" />
			Published
		</Badge>
	);
}
function IsPrivateBadge() {
	return (
		<Badge variant="default" className="flex flex-row items-center gap-1">
			<Lock className="w-4 h-4" />
			Private
		</Badge>
	);
}
