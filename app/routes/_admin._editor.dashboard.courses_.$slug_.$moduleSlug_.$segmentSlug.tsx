import { ArrowRightIcon } from "lucide-react";
import React, { Suspense } from "react";
import { href, Link, redirect, useLoaderData } from "react-router";
import { VideoPlayer } from "~/components/features/video-players/video-player";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { dashboardConfig } from "~/config/dashboard";
import {
	getLessonBySlug,
	getQuizzesForLesson,
} from "~/lib/admin/data-access/lessons/lessons.server";
import { isAdminLoggedIn } from "~/lib/auth/auth.server";
import { formatDateToString } from "~/lib/utils";
import type { Route } from "./+types/_admin._editor.dashboard.courses_.$slug_.$moduleSlug_.$segmentSlug";
import type { Question } from "./_admin.dashboard.quizzes_.create";

export async function loader({ request, params }: Route.LoaderArgs) {
	// auth check
	const { isLoggedIn } = await isAdminLoggedIn(request);
	if (!isLoggedIn) {
		throw redirect("/admin/login");
	}

	// non critical data

	const { slug: courseSlug, moduleSlug, segmentSlug } = params;

	if (!courseSlug || !moduleSlug || !segmentSlug) {
		throw redirect("/dashboard/courses");
	}

	// non critical data
	const quizzes = getQuizzesForLesson(
		request,
		segmentSlug,
		moduleSlug,
		courseSlug
	);

	// critical data
	const { success, lesson } = await getLessonBySlug(
		request,
		segmentSlug,
		moduleSlug,
		courseSlug
	);

	if (!success || !lesson) {
		throw redirect(`/dashboard/courses/${courseSlug}/${moduleSlug}`);
	}

	return {
		quizzes,
		courseSlug,
		moduleSlug,
		lesson,
	};
}

export default function LessonView({ loaderData }: Route.ComponentProps) {
	const { courseSlug, moduleSlug, lesson } = loaderData;

	return (
		<div className="flex flex-col gap-4 p-4 overflow-y-auto h-full [scrollbar-width:thin]">
			{/* display created at and edit link */}
			<div className="flex items-center justify-between w-full">
				<Button variant={"link"} asChild>
					<Link
						to={href("/dashboard/courses/:slug/:moduleSlug/:segmentSlug/edit", {
							slug: courseSlug,
							moduleSlug: moduleSlug,
							segmentSlug: lesson.slug,
						})}
					>
						Edit <ArrowRightIcon className="w-4 h-4" />
					</Link>
				</Button>
				<p className="text-sm text-gray-500 self-end">
					Created at: {formatDateToString(lesson.created_at)}
				</p>
			</div>

			{/* Video Player */}
			<VideoPlayer type={dashboardConfig.videoPlayer} url={lesson.videoUrl} />

			<Tabs defaultValue="lesson">
				<TabsList>
					<TabsTrigger value="lesson">Lesson</TabsTrigger>
					<TabsTrigger value="quizzes">Quizzes</TabsTrigger>
				</TabsList>
				<TabsContent value="lesson">
					<div className="space-y-4">
						<h2 className="text-2xl font-bold text-gray-800">{lesson.name}</h2>

						{lesson.description && (
							<div className="prose prose-gray max-w-none">
								<p className="text-gray-600 leading-relaxed">
									{lesson.description}
								</p>
							</div>
						)}
					</div>
				</TabsContent>
				<TabsContent value="quizzes">
					<Suspense fallback={<QuizzesSkeleton />}>
						<LessonQuizzes />
					</Suspense>
				</TabsContent>
			</Tabs>
			{/* Lesson Details */}
		</div>
	);
}

function LessonQuizzes() {
	const { quizzes } = useLoaderData<typeof loader>();
	const quizzesData = React.use(quizzes);

	if (
		!quizzesData.success ||
		!quizzesData.quizzes ||
		quizzesData.quizzes.length === 0
	) {
		return (
			<div className="space-y-4">
				<h2 className="text-2xl font-bold text-gray-800">Quizzes</h2>
				<div className="bg-gray-50 p-8 rounded-lg text-center">
					<p className="text-gray-600 mb-4">
						No quizzes found for this lesson.
					</p>
					<p className="text-sm text-gray-500">
						Create a quiz to test student knowledge on this lesson.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<h2 className="text-2xl font-bold text-gray-800">Quizzes</h2>

			{quizzesData.quizzes.map((quiz, quizIndex) => (
				<div
					key={quiz.id}
					className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
				>
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-semibold text-gray-800">
							Quiz {quizIndex + 1}
						</h3>
						<p className="text-sm text-gray-500">
							Created: {formatDateToString(quiz.createdAt)}
						</p>
					</div>

					<div className="space-y-6">
						{quiz.questions &&
							Array.isArray(quiz.questions) &&
							(quiz.questions as Question[]).map(
								(question: Question, questionIndex: number) => (
									<div
										key={questionIndex}
										className="border-l-4 border-blue-500 pl-4"
									>
										<h4 className="font-medium text-gray-800 mb-3">
											{questionIndex + 1}. {question.title}
										</h4>

										<div className="space-y-2">
											{question.answers.map(
												(answer: string, answerIndex: number) => (
													<div
														key={answerIndex}
														className={`flex items-center p-3 rounded-md transition-colors ${
															answerIndex === question.correctAnswerIndex
																? "bg-green-50 border border-green-200"
																: "bg-gray-50 border border-gray-200"
														}`}
													>
														<div
															className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
																answerIndex === question.correctAnswerIndex
																	? "border-green-500 bg-green-500"
																	: "border-gray-300"
															}`}
														>
															{answerIndex === question.correctAnswerIndex && (
																<svg
																	className="w-3 h-3 text-white"
																	fill="currentColor"
																	viewBox="0 0 20 20"
																>
																	<path
																		fillRule="evenodd"
																		d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
																		clipRule="evenodd"
																	/>
																</svg>
															)}
														</div>
														<span
															className={`text-sm ${
																answerIndex === question.correctAnswerIndex
																	? "text-green-800 font-medium"
																	: "text-gray-700"
															}`}
														>
															{answer}
														</span>
														{answerIndex === question.correctAnswerIndex && (
															<span className="ml-auto text-xs text-green-600 font-medium">
																Correct Answer
															</span>
														)}
													</div>
												)
											)}
										</div>
									</div>
								)
							)}
					</div>
				</div>
			))}
		</div>
	);
}

function QuizzesSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-8 w-32" />
			<div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
				<div className="flex items-center justify-between mb-4">
					<Skeleton className="h-6 w-20" />
					<Skeleton className="h-4 w-32" />
				</div>
				<div className="space-y-6">
					<div className="border-l-4 border-gray-200 pl-4">
						<Skeleton className="h-5 w-3/4 mb-3" />
						<div className="space-y-2">
							{[1, 2, 3, 4].map((i) => (
								<div
									key={i}
									className="flex items-center p-3 rounded-md bg-gray-50 border border-gray-200"
								>
									<Skeleton className="w-6 h-6 rounded-full mr-3" />
									<Skeleton className="h-4 flex-1" />
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
