import { CheckCircle, Lock, Play, Circle } from "lucide-react";
import { cn } from "~/lib/utils";

export interface LessonStatusIconProps {
	status: "locked" | "completed" | "current" | "accessible";
	canAccess: boolean;
	className?: string;
	size?: "sm" | "md" | "lg";
}

export function LessonStatusIcon({
	status,
	canAccess,
	className,
	size = "md",
}: LessonStatusIconProps) {
	const sizeClasses = {
		sm: "w-3 h-3",
		md: "w-4 h-4",
		lg: "w-5 h-5",
	};

	const iconSize = sizeClasses[size];

	switch (status) {
		case "completed":
			return (
				<CheckCircle className={cn(iconSize, "text-green-600", className)} />
			);

		case "current":
			return (
				<Play
					className={cn(iconSize, "text-blue-600 fill-blue-600", className)}
				/>
			);

		case "accessible":
			return <Circle className={cn(iconSize, "text-gray-400", className)} />;

		case "locked":
		default:
			return <Lock className={cn(iconSize, "text-gray-300", className)} />;
	}
}

export interface LessonNavItemProps {
	lessonName: string;
	lessonSlug: string;
	orderIndex: number;
	status: "locked" | "completed" | "current" | "accessible";
	canAccess: boolean;
	courseSlug: string;
	moduleSlug: string;
	className?: string;
	onClick?: () => void;
}

export function LessonNavItem({
	lessonName,
	lessonSlug,
	orderIndex,
	status,
	canAccess,
	courseSlug,
	moduleSlug,
	className,
	onClick,
}: LessonNavItemProps) {
	const isDisabled = !canAccess;
	const isCurrent = status === "current";
	const isCompleted = status === "completed";

	// Base classes for the navigation item
	const baseClasses = cn(
		"flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-200",
		{
			// Current lesson styling
			"bg-blue-50 border border-blue-200 text-blue-800 font-medium": isCurrent,

			// Completed lesson styling
			"text-green-700 hover:bg-green-50": isCompleted && !isCurrent,

			// Accessible lesson styling
			"text-gray-700 hover:bg-gray-100 cursor-pointer":
				canAccess && !isCurrent && !isCompleted,

			// Locked lesson styling
			"text-gray-400 cursor-not-allowed opacity-60": isDisabled,
		},
		className
	);

	const handleClick = () => {
		if (!isDisabled && onClick) {
			onClick();
		}
	};

	if (isDisabled) {
		// Render as disabled div for locked lessons
		return (
			<div className={baseClasses}>
				<LessonStatusIcon status={status} canAccess={canAccess} size="sm" />
				<span className="flex-1 truncate">
					{orderIndex + 1}. {lessonName}
				</span>
				{isDisabled && (
					<span className="text-xs text-gray-400 font-medium">Locked</span>
				)}
			</div>
		);
	}

	// Render as Link for accessible lessons
	return (
		<a
			href={`/student/courses/${courseSlug}/${moduleSlug}/${lessonSlug}`}
			className={baseClasses}
			onClick={handleClick}
		>
			<LessonStatusIcon status={status} canAccess={canAccess} size="sm" />
			<span className="flex-1 truncate">
				{orderIndex + 1}. {lessonName}
			</span>
			{isCurrent && (
				<span className="text-xs text-blue-600 font-medium">Current</span>
			)}
			{isCompleted && (
				<span className="text-xs text-green-600 font-medium">✓</span>
			)}
		</a>
	);
}

export interface ModuleLessonListProps {
	moduleSlug: string;
	moduleName: string;
	lessons: Array<{
		lessonSlug: string;
		lessonName: string;
		orderIndex: number;
		status: "locked" | "completed" | "current" | "accessible";
		canAccess: boolean;
	}>;
	courseSlug: string;
	className?: string;
	onLessonClick?: (lessonSlug: string) => void;
}

export function ModuleLessonList({
	moduleSlug,
	moduleName,
	lessons,
	courseSlug,
	className,
	onLessonClick,
}: ModuleLessonListProps) {
	const completedCount = lessons.filter(
		(lesson) => lesson.status === "completed"
	).length;
	const totalCount = lessons.length;
	const progressPercentage =
		totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

	return (
		<div className={cn("space-y-3", className)}>
			{/* Module Header with Progress */}
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<h3 className="font-medium text-gray-800 truncate">{moduleName}</h3>
					<span className="text-xs text-gray-500 whitespace-nowrap">
						{completedCount}/{totalCount}
					</span>
				</div>

				{/* Progress Bar */}
				<div className="w-full bg-gray-200 rounded-full h-2">
					<div
						className="bg-green-500 h-2 rounded-full transition-all duration-300"
						style={{ width: `${progressPercentage}%` }}
					/>
				</div>
			</div>

			{/* Lesson List */}
			<div className="space-y-1">
				{lessons.map((lesson) => (
					<LessonNavItem
						key={lesson.lessonSlug}
						lessonName={lesson.lessonName}
						lessonSlug={lesson.lessonSlug}
						orderIndex={lesson.orderIndex}
						status={lesson.status}
						canAccess={lesson.canAccess}
						courseSlug={courseSlug}
						moduleSlug={moduleSlug}
						onClick={() => onLessonClick?.(lesson.lessonSlug)}
					/>
				))}
			</div>
		</div>
	);
}
