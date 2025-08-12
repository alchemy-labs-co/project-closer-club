import { ArrowLeft } from "lucide-react";
import React, { Suspense } from "react";
import {
	Link,
	Outlet,
	redirect,
	useLocation,
	useRouteLoaderData,
} from "react-router";
import { LessonStatusIcon } from "~/components/features/students/lesson-status-icon";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import { isAgentLoggedIn } from "~/lib/auth/auth.server";
import { getCompletedLessonsCount } from "~/lib/student/data-access/assignments.server";
import {
	getCourseBySlug,
	getModulesAndLessonsForCourse,
	getTotalLessonsCount,
} from "~/lib/student/data-access/courses.server";
import { getLessonStatusesForCourse } from "~/lib/student/data-access/lesson-status.server";
import type { Route } from "./+types/_agent._editor";

export async function loader({ request, params }: Route.LoaderArgs) {
	const { isLoggedIn, student } = await isAgentLoggedIn(request);
	if (!isLoggedIn || !student) {
		throw redirect("/login");
	}

	const { courseSlug } = params;
	if (!courseSlug) {
		throw redirect("/student/courses");
	}

	const { course } = await getCourseBySlug(request, courseSlug);

	if (!course) {
		throw redirect("/student/courses");
	}

	// Return a promise for modules and lessons instead of awaiting it
	const modulesAndLessonsPromise = getModulesAndLessonsForCourse(
		request,
		courseSlug,
	);

	const progressPromise = (async () => {
		const totalLessons = await getTotalLessonsCount(request, course.id);
		const completedLessons = await getCompletedLessonsCount(request, course.id);
		return { totalLessons, completedLessons };
	})();

	// Add lesson status data for the sidebar navigation
	const lessonStatusesPromise = getLessonStatusesForCourse(
		student.id,
		courseSlug,
	);

	return {
		courseSlug,
		studentId: student.id,
		studentName: student.name,
		modulesAndLessonsPromise,
		progressPromise,
		lessonStatusesPromise,
	};
}

export function useAgentEditorLoaderData() {
	const data = useRouteLoaderData<typeof loader>("routes/_agent._editor");
	if (!data) {
		throw new Error(
			"Agent Editor Loader needs to be used within an Agent Editor context, the route needs to be a child of the Agent Editor route",
		);
	}
	return data;
}

function ModulesAndLessonsContent() {
	const { modulesAndLessonsPromise, courseSlug, lessonStatusesPromise } =
		useAgentEditorLoaderData();
	const { modules, lessons } = React.use(modulesAndLessonsPromise);
	const lessonStatuses = React.use(lessonStatusesPromise);
	const location = useLocation();
	const pathname = location.pathname;
	const hasModules = modules.length > 0;

	// Helper function to get lesson status
	const getLessonStatus = (lessonSlug: string, moduleSlug: string) => {
		// Find the module status data
		const moduleStatus = lessonStatuses.find(
			(m) => m.moduleSlug === moduleSlug,
		);
		if (!moduleStatus) return null;

		// Find the lesson status within that module
		return (
			moduleStatus.lessons.find((l) => l.lessonSlug === lessonSlug) || null
		);
	};

	return (
		<div className="flex-1 relative h-full">
			<nav className="h-full w-full">
				<h3 className="font-semibold text-sm text-gray-900 mb-3">
					Course Navigation
				</h3>

				{hasModules && (
					<div className="space-y-2 w-full h-full overflow-y-auto [scrollbar-width:thin] pb-4">
						{modules.map((module) => {
							const moduleLessons = lessons.filter(
								(lesson) => lesson.moduleId === module.id,
							);
							const isModuleActive =
								pathname === `/student/courses/${courseSlug}/${module.slug}` ||
								pathname.startsWith(
									`/student/courses/${courseSlug}/${module.slug}/`,
								);

							// If module has no lessons, just display the module name as a clickable link
							if (moduleLessons.length === 0) {
								return (
									<span
										key={module.id}
										className={`block w-full p-3 text-left text-sm font-medium rounded-md border border-gray-200 transition-colors ${
											isModuleActive
												? "bg-blue-50 text-blue-700 border-blue-200"
												: "text-gray-700 bg-white hover:bg-gray-50"
										}`}
									>
										{module.name}
									</span>
								);
							}

							// If module has lessons, use accordion
							return (
								<Accordion
									key={module.id}
									type="single"
									collapsible
									className="w-full"
									defaultValue={isModuleActive ? module.id : undefined}
								>
									<AccordionItem value={module.id} className="border-none">
										<AccordionTrigger
											className={`w-full p-3 text-left text-sm font-medium rounded-md border border-gray-200 hover:bg-gray-50 [&[data-state=open]]:rounded-b-none transition-colors ${
												isModuleActive
													? "bg-blue-50 text-blue-700 border-blue-200"
													: "text-gray-700 bg-white"
											}`}
										>
											<span className="flex-1 text-left">{module.name}</span>
										</AccordionTrigger>
										<AccordionContent className="p-0 bg-white border border-gray-200 border-t-0 rounded-b-md">
											<ul className="space-y-0">
												{moduleLessons.map((lesson) => {
													const isLessonActive =
														pathname ===
														`/student/courses/${courseSlug}/${module.slug}/${lesson.slug}`;

													const lessonStatus = getLessonStatus(
														lesson.slug,
														module.slug,
													);
													const isLocked = lessonStatus
														? !lessonStatus.canAccess
														: false;
													const status = lessonStatus?.status || "accessible";

													// If lesson is locked, render as non-clickable div
													if (isLocked) {
														return (
															<li key={lesson.id}>
																<div className="flex items-center gap-2 px-4 py-2 text-sm border-b border-gray-100 last:border-b-0 text-gray-400 cursor-not-allowed opacity-60">
																	<LessonStatusIcon
																		status={status}
																		canAccess={false}
																		size="sm"
																	/>
																	<span className="flex-1">{lesson.name}</span>
																	<span className="text-xs font-medium">
																		Locked
																	</span>
																</div>
															</li>
														);
													}

													return (
														<li key={lesson.id}>
															<Link
																to={`/student/courses/${courseSlug}/${module.slug}/${lesson.slug}`}
																className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors border-b border-gray-100 last:border-b-0 ${
																	isLessonActive
																		? "bg-blue-50 text-blue-700 font-medium"
																		: status === "completed"
																			? "text-green-700 hover:bg-green-50"
																			: "text-gray-600 hover:bg-gray-50"
																}`}
															>
																<LessonStatusIcon
																	status={status}
																	canAccess={true}
																	size="sm"
																/>
																<span className="flex-1">{lesson.name}</span>
																{status === "completed" && (
																	<span className="text-xs text-green-600 font-medium">
																		✓
																	</span>
																)}
																{isLessonActive && (
																	<span className="text-xs text-blue-600 font-medium">
																		Current
																	</span>
																)}
															</Link>
														</li>
													);
												})}
											</ul>
										</AccordionContent>
									</AccordionItem>
								</Accordion>
							);
						})}
					</div>
				)}
				{!hasModules && (
					<p className="text-xs text-gray-500">
						No modules available for this course
					</p>
				)}
			</nav>
			{/* Gradient mask to indicate scrollable content */}
		</div>
	);
}

function ModulesAndLessonsFallback() {
	return (
		<div className="p-3 bg-white rounded-lg border">
			<h3 className="font-semibold text-sm text-gray-900 mb-3">
				Course Navigation
			</h3>
			<div className="space-y-3">
				{/* Loading skeleton for modules */}
				{[1, 2, 3].map((i) => (
					<div key={i} className="space-y-2">
						<div className="h-4 bg-gray-200 rounded animate-pulse" />
						<div className="space-y-1 pl-2">
							{[1, 2].map((j) => (
								<div
									key={j}
									className="h-3 bg-gray-100 rounded animate-pulse"
								/>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function ProgressContent() {
	const { progressPromise } = useAgentEditorLoaderData();
	const { totalLessons, completedLessons } = React.use(progressPromise);

	const progressPercentage =
		totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

	return (
		<div className="p-3 bg-white rounded-lg border">
			<h3 className="font-semibold text-sm text-gray-900 mb-2">Progress</h3>
			<div className="space-y-2">
				<div className="flex justify-between text-xs">
					<span className="text-gray-600">Completed</span>
					<span className="font-medium text-gray-800">
						{completedLessons} / {totalLessons}
					</span>
				</div>
				<div className="w-full bg-gray-200 rounded-full h-2">
					<div
						className="bg-blue-600 h-2 rounded-full"
						style={{ width: `${progressPercentage}%` }}
					/>
				</div>
			</div>
		</div>
	);
}

function ProgressFallback() {
	return (
		<div className="p-3 bg-white rounded-lg border">
			<h3 className="font-semibold text-sm text-gray-900 mb-2">Progress</h3>
			<div className="space-y-2">
				<div className="flex justify-between text-xs">
					<span className="text-gray-600">Completed</span>
					<div className="h-3 w-8 bg-gray-200 rounded animate-pulse" />
				</div>
				<div className="w-full bg-gray-200 rounded-full h-2">
					<div className="bg-gray-300 h-2 rounded-full w-0 animate-pulse" />
				</div>
			</div>
		</div>
	);
}

function AgentCourseSidebar() {
	return (
		<aside className="w-full md:w-64 h-[calc(100vh-var(--navbar-height))] overflow-hidden bg-gray-50 md:border-r border-r-0 border-b md:border-b-0 border-gray-200 p-2 flex flex-col justify-between gap-4 sticky top-18">
			<div className="h-full flex flex-col gap-4 overflow-hidden bg-white rounded-lg border p-3">
				<Suspense fallback={<ModulesAndLessonsFallback />}>
					<ModulesAndLessonsContent />
				</Suspense>
			</div>
			<Suspense fallback={<ProgressFallback />}>
				<ProgressContent />
			</Suspense>
		</aside>
	);
}

export default function AgentEditorLayout() {
	return (
		<div className="flex flex-col-reverse gap-8 md:gap-0 md:flex-row  min-h-[calc(100vh-var(--navbar-height))]">
			<AgentCourseSidebar />
			<div className="flex-1 rounded-lg p-4 overflow-y-auto">
				<div className="max-w-7xl mx-auto flex flex-col gap-8">
					<Button variant="secondary" asChild>
						<Link to="/student/courses" className="w-fit">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Courses
						</Link>
					</Button>
					<Outlet />
				</div>
			</div>
		</div>
	);
}
