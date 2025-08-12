import { ArrowLeft } from "lucide-react";
import React, { Suspense } from "react";
import {
	Link,
	Outlet,
	redirect,
	useLocation,
	useRouteLoaderData,
} from "react-router";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import { isTeamLeaderLoggedIn } from "~/lib/auth/auth.server";
import {
	getCourseBySlugForTeamLeader,
	getModulesAndLessonsForCourseForTeamLeader,
	getTotalLessonsCountForTeamLeader,
} from "~/lib/team-leaders/data-access/courses.server";
import type { Route } from "./+types/_team._editor";

export async function loader({ request, params }: Route.LoaderArgs) {
	const { isLoggedIn, teamLeader } = await isTeamLeaderLoggedIn(request);
	if (!isLoggedIn || !teamLeader) {
		throw redirect("/team-leader/login");
	}

	const { courseSlug } = params;
	if (!courseSlug) {
		throw redirect("/team/courses");
	}

	const { course } = await getCourseBySlugForTeamLeader(request, courseSlug);

	if (!course) {
		throw redirect("/team/courses");
	}

	// Return a promise for modules and lessons instead of awaiting it
	const modulesAndLessonsPromise = getModulesAndLessonsForCourseForTeamLeader(
		request,
		courseSlug,
	);

	const progressPromise = (async () => {
		const totalLessons = await getTotalLessonsCountForTeamLeader(
			request,
			course.id,
		);
		return { totalLessons, completedLessons: 0 }; // Team leaders don't track completion
	})();

	return {
		courseSlug,
		teamLeaderId: teamLeader.id,
		teamLeaderName: teamLeader.name,
		modulesAndLessonsPromise,
		progressPromise,
	};
}

export function useTeamLeaderEditorLoaderData() {
	const data = useRouteLoaderData<typeof loader>("routes/_team._editor");
	if (!data) {
		throw new Error(
			"Team Leader Editor Loader needs to be used within a Team Leader Editor context, the route needs to be a child of the Team Leader Editor route",
		);
	}
	return data;
}

function ModulesAndLessonsContent() {
	const { modulesAndLessonsPromise, courseSlug } =
		useTeamLeaderEditorLoaderData();
	const { modules, lessons } = React.use(modulesAndLessonsPromise);
	const location = useLocation();
	const pathname = location.pathname;
	const hasModules = modules.length > 0;

	return (
		<div className="flex flex-col h-full min-h-0">
			<h3 className="font-semibold text-sm text-gray-900 mb-3 flex-shrink-0">
				Course Navigation
			</h3>

			{hasModules && (
				<div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin] space-y-2 pb-4">
					{modules.map((module) => {
						const moduleLessons = lessons.filter(
							(lesson) => lesson.moduleId === module.id,
						);
						const isModuleActive =
							pathname === `/team/courses/${courseSlug}/${module.slug}` ||
							pathname.startsWith(
								`/team/courses/${courseSlug}/${module.slug}/`,
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
													`/team/courses/${courseSlug}/${module.slug}/${lesson.slug}`;

												return (
													<li key={lesson.id}>
														<Link
															to={`/team/courses/${courseSlug}/${module.slug}/${lesson.slug}`}
															className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors border-b border-gray-100 last:border-b-0 ${
																isLessonActive
																	? "bg-blue-50 text-blue-700 font-medium"
																	: "text-gray-600 hover:bg-gray-50"
															}`}
														>
															<span className="flex-1">{lesson.name}</span>
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

function TeamLeaderCourseSidebar() {
	return (
		<aside className="w-full flex-1 md:max-w-64 h-[calc(100vh-76.8px)] max-h-[calc(100vh-76.8px)] overflow-hidden bg-gray-50 md:border-r border-r-0 border-b md:border-b-0 border-gray-200 p-2 flex flex-col gap-4 sticky top-0">
			<div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white rounded-lg border p-3">
				<Suspense fallback={<ModulesAndLessonsFallback />}>
					<ModulesAndLessonsContent />
				</Suspense>
			</div>
		</aside>
	);
}

export default function TeamLeaderEditorLayout() {
	return (
		<div className="flex flex-col-reverse gap-8 md:gap-0 md:flex-row  overflow-hidden min-h-[calc(100dvh-76.8px)]">
			<TeamLeaderCourseSidebar />
			<div className="flex-1 rounded-lg p-4 overflow-y-auto max-h-[calc(100dvh-76.8px)]">
				<div className="max-w-7xl mx-auto flex flex-col gap-8">
					<Button variant="secondary" asChild>
						<Link to="/team/courses" className="w-fit">
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
