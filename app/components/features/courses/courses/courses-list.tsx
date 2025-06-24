import { ChevronRight, CircleCheck, Lock, Pencil } from "lucide-react";
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
import { useCoursesLoaderData } from "~/routes/_admin.dashboard.courses";
import { MarkAsPublic } from "./mark-as-public";
import { MarkAsPrivate } from "./mark-as-private";
import type { Course } from "~/db/schema";
import { DeleteCourse } from "./delete-course";
import { EditCourse } from "./edit-course";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";

export function CoursesList() {
	const { courses } = useCoursesLoaderData();
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
			{courses.map((course) => (
				<CourseCard key={course.id} course={course} />
			))}
		</div>
	);
}
function CourseCard({ course }: { course: Course }) {
	const { id, name, description, isPublic, slug } = course;
	return (
		<Card className="relative">
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
