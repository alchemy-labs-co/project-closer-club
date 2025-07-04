import {
	AlertCircleIcon,
	DownloadIcon,
	FileIcon,
	LockIcon,
} from "lucide-react";
import React, { Suspense } from "react";
import {
	Link,
	redirect,
	useFetcher,
	useNavigation,
	useRouteLoaderData,
} from "react-router";
import { QuizCompletedResults } from "~/components/features/courses/quiz/quiz-completed-results";
import { VideoPlayer } from "~/components/features/video-players/video-player";
import PrimaryButton from "~/components/global/brand/primary-button";
import { Skeleton } from "~/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { dashboardConfig } from "~/config/dashboard";
import type { Quiz } from "~/db/schema";
import { isAgentLoggedIn } from "~/lib/auth/auth.server";
import { getCompletedAssignmentForLesson } from "~/lib/student/data-access/assignments.server";
import { getAttachmentsForLesson } from "~/lib/student/data-access/attachments.server";
import {
	getLessonBySlug,
	getQuizzesForLesson,
} from "~/lib/student/data-access/lessons.server.";
import type { FetcherResponse, FetcherSubmitQuizResponse } from "~/lib/types";
import type { Route } from "./+types/_agent._editor.student.courses_.$courseSlug_.$moduleSlug_.$lessonSlug";
import {
	canAccessLesson,
	getNextLessonAfterCurrent,
} from "~/lib/student/data-access/lesson-locking.server";
import { getStudentCertificateForCourse } from "~/lib/student/data-access/certificates.server";
import { useAgentEditorLoaderData } from "./_agent._editor";
import { slugToTitle } from "~/lib/utils";

export async function loader({ request, params }: Route.LoaderArgs) {
	const { isLoggedIn, student } = await isAgentLoggedIn(request);

	if (!isLoggedIn || !student) {
		throw redirect("/student/courses");
	}

	const { courseSlug, moduleSlug, lessonSlug } = params;

	if (!courseSlug || !moduleSlug || !lessonSlug) {
		throw redirect("/student/courses");
	}

	const accessResult = await canAccessLesson(
		student.id,
		courseSlug,
		moduleSlug,
		lessonSlug
	);

	// If they can't access, redirect them to the required lesson
	if (!accessResult.canAccess) {
		if (accessResult.redirectTo) {
			// Redirect to the lesson they need to complete first
			throw redirect(`/student/courses/${accessResult.redirectTo}`);
		}
			throw redirect(`/student/courses/${courseSlug}`);
		
	}

	// critical data
	const { lesson, completedAssignment } = await criticalLoaderData(
		request,
		courseSlug,
		moduleSlug,
		lessonSlug
	);

	// non critical data
	const nonCriticalData = nonCriticalLoaderData(
		request,
		moduleSlug,
		lessonSlug,
		courseSlug,
		lesson.id,
		student.id
	);

	return {
		nonCriticalData,
		lesson,
		completedAssignment,
		studentId: student.id,
		studentName: student.name,
		courseSlug,
		moduleSlug,
		lessonSlug,
	};
}

async function criticalLoaderData(
	request: Request,
	courseSlug: string,
	moduleSlug: string,
	lessonSlug: string
) {
	const { lesson } = await getLessonBySlug(
		request,
		moduleSlug,
		lessonSlug,
		courseSlug
	);

	if (!lesson) {
		throw redirect("/student/courses");
	}

	// Get completed assignment as critical data
	const { completedAssignment } = await getCompletedAssignmentForLesson(
		request,
		lessonSlug,
		moduleSlug,
		courseSlug
	);

	return { lesson, completedAssignment };
}

function nonCriticalLoaderData(
	request: Request,
	moduleSlug: string,
	lessonSlug: string,
	courseSlug: string,
	lessonId: string,
	studentId: string
) {
	// all these will return promises
	const quizzes = getQuizzesForLesson(
		request,
		moduleSlug,
		lessonSlug,
		courseSlug
	);

	const attachments = getAttachmentsForLesson(request, lessonId);

	// Get next lesson as a promise (non-blocking)
	const nextLesson = getNextLessonAfterCurrent(
		studentId,
		courseSlug,
		moduleSlug,
		lessonSlug
	);

	// Get certificate for this course if it exists
	const certificate = getStudentCertificateForCourse(request, studentId, courseSlug);

	return { quizzes, attachments, nextLesson, certificate };
}

function useLessonLoaderData() {
	const data = useRouteLoaderData<typeof loader>(
		"routes/_agent._editor.student.courses_.$courseSlug_.$moduleSlug_.$lessonSlug"
	);
	if (!data) {
		throw new Error(
			"VideoContent must be used within _agent._editor._tabs route"
		);
	}

	return data;
}

export default function AgentEditorLesson() {
	const navigation = useNavigation();
	const { completedAssignment } = useLessonLoaderData();

	const isAssignmentCompleted = completedAssignment !== null;
	const isNavigating = navigation.state !== "idle";

	// Show loading state when navigating between lessons
	if (isNavigating) {
		return (
			<div className="flex flex-col gap-8">
				<Skeleton className="w-full h-[400px] rounded-lg" />
				<div className="space-y-4">
					<Skeleton className="w-full h-[40px]" />
					<Skeleton className="w-full h-[200px]" />
				</div>
				<Skeleton className="w-full h-[50px]" />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-8">
			<VideoContent />
			<VideoContentTabs />
			{!isAssignmentCompleted && <LockNextLessonButton />}
			{isAssignmentCompleted && (
				<Suspense fallback={<Skeleton className="w-full h-[30px]" />}>
					<ProccedToNextLessonButton />
				</Suspense>
			)}
		</div>
	);
}

function VideoContent() {
	const { lesson } = useLessonLoaderData();

	return (
		<VideoPlayer type={dashboardConfig.videoPlayer} url={lesson.videoUrl} />
	);
}

function VideoContentTabs() {
	const { lesson, completedAssignment } = useLessonLoaderData();

	return (
		<Tabs defaultValue="overview" className="flex flex-col gap-6 w-full">
			<TabsList className="w-full">
				<TabsTrigger value="overview">Overview</TabsTrigger>
				<TabsTrigger value="quizzes" className="relative">
					Quizzes
					{!completedAssignment && (
						<span className="absolute top-1 right-4 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
					)}
					{completedAssignment && (
						<span className="absolute top-1 right-4 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
					)}
				</TabsTrigger>
				<TabsTrigger value="resources">Resources</TabsTrigger>
			</TabsList>
			<TabsContent value="overview">
				<div className="space-y-4">
					<h2 className="text-2xl font-bold text-gray-800">{lesson.name}</h2>
					{lesson.description && (
						<div className="prose prose-gray text-balance">
							<p className="text-gray-600 leading-relaxed">
								{lesson.description}
							</p>
						</div>
					)}
				</div>
			</TabsContent>
			<TabsContent value="quizzes">
				<Suspense fallback={<Skeleton className="w-full h-[200px]" />}>
					<QuizzesContent />
				</Suspense>
			</TabsContent>
			<TabsContent value="resources">
				<Suspense fallback={<Skeleton className="w-full h-[200px]" />}>
					<ResourcesContent />
				</Suspense>
			</TabsContent>
		</Tabs>
	);
}

function QuizzesContent() {
	const { nonCriticalData, completedAssignment } = useLessonLoaderData();
	const quizzesPromise = React.use(nonCriticalData.quizzes);

	const isThereQuizzes = quizzesPromise.quizzes !== null;

	if (!isThereQuizzes) {
		return <div>No quizzes present at the moment</div>;
	}

	// If quiz assignment does not exist, show the quiz display
	if (!completedAssignment) {
		return <QuizDisplay quiz={quizzesPromise.quizzes} />;
	}

	// Otherwise, show the completed assignment status
	return (
		<QuizCompletedResults
			quiz={quizzesPromise.quizzes}
			completedAssignment={completedAssignment}
		/>
	);
}

function ResourcesContent() {
	const { nonCriticalData } = useLessonLoaderData();
	const { attachments } = React.use(nonCriticalData.attachments);

	const hasAttachments = attachments !== null;

	if (!hasAttachments) {
		return (
			<div className="text-center py-8">
				<FileIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
				<p className="text-gray-500">No resources available for this lesson.</p>
			</div>
		);
	}

	return (
		<div className="grid gap-3">
			{attachments.map((attachment) => (
				<AttachmentItem key={attachment.id} attachment={attachment} />
			))}
		</div>
	);
}

function AttachmentItem({
	attachment,
}: {
	attachment: {
		id: string;
		fileName: string;
		fileUrl: string;
		fileExtension: string;
		createdAt: Date;
	};
}) {
	const handleDownload = () => {
		window.open(attachment.fileUrl, "_blank");
	};

	const getFileIcon = (extension: string) => {
		const ext = extension.toLowerCase();
		if (ext === "pdf") return "📄";
		if (ext === "doc" || ext === "docx") return "📝";
		if (ext === "png" || ext === "jpg" || ext === "jpeg") return "🖼️";
		return "📎";
	};

	return (
		<div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors">
			<div className="flex items-center gap-3">
				<span className="text-2xl" role="img" aria-label="file">
					{getFileIcon(attachment.fileExtension)}
				</span>
				<div>
					<p className="font-medium text-gray-800">{attachment.fileName}</p>
					<p className="text-sm text-gray-500 capitalize">
						{attachment.fileExtension.toUpperCase()} file
					</p>
				</div>
			</div>
			<button
			type="button"
				onClick={handleDownload}
				className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
			>
				<DownloadIcon className="w-4 h-4" />
				Download
			</button>
		</div>
	);
}

function QuizDisplay({ quiz }: { quiz: Quiz | null }) {
	const { studentId } = useLessonLoaderData();
	const [selectedAnswers, setSelectedAnswers] = React.useState<{
		[questionIndex: number]: number;
	}>({});
	const [quizState, setQuizState] = React.useState<"taking" | "submitted">(
		"taking"
	);
	const [lastSubmissionData, setLastSubmissionData] =
		React.useState<FetcherSubmitQuizResponse | null>(null);

	const fetcher = useFetcher<FetcherSubmitQuizResponse>();
	const { data: fetcherData } = fetcher;
	const currentQuiz = quiz || null;

	const questions = currentQuiz?.questions || [];

	// Update last submission data when fetcher completes
	React.useEffect(() => {
		if (fetcherData?.success && fetcher.state === "idle") {
			setLastSubmissionData(fetcherData);
			setQuizState("submitted");
		}
	}, [fetcherData, fetcher.state]);

	// Reset quiz to taking state
	const resetQuiz = () => {
		setSelectedAnswers({});
		setQuizState("taking");
		setLastSubmissionData(null);
	};

	const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
		setSelectedAnswers((prev) => ({
			...prev,
			[questionIndex]: answerIndex,
		}));
	};

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!currentQuiz?.id) {
			console.error("No quiz ID available");
			return;
		}

		const answersArray = questions.map(
			(_, index) => selectedAnswers[index] ?? -1
		);

		fetcher.submit(
			{
				intent: "submit-quiz",
				quizId: currentQuiz.id,
				selectedAnswers: JSON.stringify(answersArray),
				lessonId: currentQuiz.lessonId,
				studentId: studentId,
			},
			{
				method: "post",
				action: "/resource/assignments",
			}
		);
	};

	const isAllQuestionsAnswered = questions.every(
		(_, index) => selectedAnswers[index] !== undefined
	);

	const isPending = fetcher.state !== "idle";

	// Handle case where there are no questions
	if (!questions || questions.length === 0) {
		return (
			<div className="text-center py-8">
				<p className="text-gray-500">No questions available for this quiz.</p>
			</div>
		);
	}

	// Show quiz results if submitted
	if (quizState === "submitted" && lastSubmissionData) {
		return (
			<div className="space-y-6">
				{/* Quiz Results Header */}
				<div className="text-center p-6 border rounded-lg">
					<div className="space-y-2">
						<AlertCircleIcon className="w-12 h-12 text-red-600 mx-auto" />
						<h3 className="text-xl font-semibold text-red-800">Quiz Failed</h3>
						<p className="text-red-600">
							Score: {lastSubmissionData.score}/
							{lastSubmissionData.totalQuestions}
						</p>
						<p className="text-sm text-gray-600">
							{lastSubmissionData.message}
						</p>
					</div>
				</div>

				{/* Show incorrect answers for review */}
				{!lastSubmissionData.passed &&
					lastSubmissionData.incorrectQuestions && (
						<div className="space-y-4">
							<h4 className="text-lg font-semibold text-red-800">
								Review Incorrect Answers:
							</h4>
							{lastSubmissionData.incorrectQuestions.map((incorrectQ) => (
								<div
									key={incorrectQ.questionIndex}
									className="p-4 border border-red-200 rounded-lg bg-red-50"
								>
									<h5 className="font-medium text-red-800 mb-3">
										{incorrectQ.questionIndex + 1}. {incorrectQ.question}
									</h5>
									<div className="space-y-2">
										{incorrectQ.answers.map((answer, answerIndex) => (
											<div
												key={answer}
												className={`flex items-center gap-3 p-2 rounded ${
													answerIndex === incorrectQ.correctAnswer
														? "bg-green-100 border border-green-300"
														: answerIndex === incorrectQ.selectedAnswer
														? "bg-red-100 border border-red-300"
														: "bg-white border border-gray-200"
												}`}
											>
												<span
													className={`text-sm font-medium ${
														answerIndex === incorrectQ.correctAnswer
															? "text-green-700"
															: answerIndex === incorrectQ.selectedAnswer
															? "text-red-700"
															: "text-gray-600"
													}`}
												>
													{answerIndex === incorrectQ.correctAnswer
														? "✓"
														: answerIndex === incorrectQ.selectedAnswer
														? "✗"
														: " "}
												</span>
												<span
													className={`flex-1 ${
														answerIndex === incorrectQ.correctAnswer
															? "text-green-800"
															: answerIndex === incorrectQ.selectedAnswer
															? "text-red-800"
															: "text-gray-700"
													}`}
												>
													{answer}
												</span>
												{answerIndex === incorrectQ.correctAnswer && (
													<span className="text-xs text-green-600 font-medium">
														Correct Answer
													</span>
												)}
												{answerIndex === incorrectQ.selectedAnswer &&
													answerIndex !== incorrectQ.correctAnswer && (
														<span className="text-xs text-red-600 font-medium">
															Your Answer
														</span>
													)}
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					)}

				{/* Try Again Button for failed quizzes */}
				{!lastSubmissionData.passed && (
					<div className="pt-4">
						<PrimaryButton onClick={resetQuiz} className="w-full" type="button">
							Try Again
						</PrimaryButton>
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="text-center">
				<h3 className="text-xl font-semibold text-gray-800 mb-2">
					Quiz Assessment
				</h3>
				<p className="text-gray-600 text-sm">
					Answer all questions below to complete this lesson
				</p>
			</div>

			<fetcher.Form onSubmit={handleSubmit} className="space-y-6">
				{questions.map((question, questionIndex) => (
					<QuizQuestion
						key={question.title}
						question={question}
						questionIndex={questionIndex}
						selectedAnswer={selectedAnswers[questionIndex]}
						onAnswerSelect={handleAnswerSelect}
					/>
				))}

				<div className="pt-4 border-t border-gray-200">
					{!isAllQuestionsAnswered && (
						<div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
							<AlertCircleIcon className="w-4 h-4 text-amber-600 flex-shrink-0" />
							<p className="text-sm text-amber-700">
								Please answer all questions before submitting
							</p>
						</div>
					)}

					<PrimaryButton
						type="submit"
						className="w-full"
						disabled={!isAllQuestionsAnswered || isPending}
					>
						{isPending ? "Submitting..." : "Submit Quiz"}
					</PrimaryButton>
				</div>
			</fetcher.Form>
		</div>
	);
}

function QuizQuestion({
	question,
	questionIndex,
	selectedAnswer,
	onAnswerSelect,
}: {
	question: {
		title: string;
		answers: string[];
		correctAnswerIndex: number;
	};
	questionIndex: number;
	selectedAnswer: number | undefined;
	onAnswerSelect: (questionIndex: number, answerIndex: number) => void;
}) {
	return (
		<div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-white">
			<div className="space-y-3">
				<h4 className="font-medium text-gray-800">
					{questionIndex + 1}. {question.title}
				</h4>

				<div className="space-y-2">
					{question.answers.map((answer, answerIndex) => (
						<label
							key={answer}
							className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
								selectedAnswer === answerIndex
									? "border-blue-500 bg-blue-50"
									: "border-gray-200"
							}`}
						>
							<input
								type="radio"
								name={`question-${questionIndex}`}
								value={answerIndex}
								checked={selectedAnswer === answerIndex}
								onChange={() => onAnswerSelect(questionIndex, answerIndex)}
								className="text-blue-600 focus:ring-blue-500"
							/>
							<span className="text-gray-700 flex-1">{answer}</span>
						</label>
					))}
				</div>
			</div>
		</div>
	);
}

function LockNextLessonButton() {
	return (
		<Tooltip>
			<TooltipProvider>
				<TooltipTrigger asChild>
					<PrimaryButton disabled={true}>
						<LockIcon className="w-4 h-4" />
						Procced to Next Lesson
					</PrimaryButton>
				</TooltipTrigger>
				<TooltipContent>You must complete the quiz to proceed</TooltipContent>
			</TooltipProvider>
		</Tooltip>
	);
}

function ProccedToNextLessonButton() {
	const { nonCriticalData } = useLessonLoaderData();
	const nextLesson = React.use(nonCriticalData.nextLesson);

	console.log(nextLesson);

	// If there's no next lesson, show completion message or redirect to course overview
	if (!nextLesson) {
		return (
			<MarkCourseAsCompleted/>
		);
	}

	return (
		<PrimaryButton asChild>
			<Link
				to={`/student/courses/${nextLesson.courseSlug}/${nextLesson.moduleSlug}/${nextLesson.lessonSlug}`}
			>
				Proceed to Next Lesson
			</Link>
		</PrimaryButton>
	);
}

function MarkCourseAsCompleted() {
	const { studentId, courseSlug, nonCriticalData, studentName} = useLessonLoaderData()
	const courseName = slugToTitle(courseSlug)
	const fetcher = useFetcher<FetcherResponse>();
	const isSubmitting = fetcher.state !== "idle";
	const { data: fetcherData } = fetcher;
	
	// Get certificate data from loader (this will be available after page load)
	const certificate = React.use(nonCriticalData.certificate);

	// Show download link if certificate is available from loader data
	if (certificate?.certificateUrl) {
		return (
			<div className="space-y-4">
				<div className="text-center p-6 border border-green-200 rounded-lg bg-green-50">
					<div className="space-y-3">
						<div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
							<span className="text-2xl">🎓</span>
						</div>
						<h3 className="text-xl font-semibold text-green-800">
							Congratulations!
						</h3>
						<p className="text-green-700">
							You have successfully completed <strong>{courseName}</strong>
						</p>
						<p className="text-sm text-green-600">
							Your certificate is ready for download.
						</p>
					</div>
				</div>
				<PrimaryButton 
					asChild 
					className="w-full"
				>
					<a 
						href={certificate.certificateUrl} 
						target="_blank" 
						rel="noopener noreferrer"
						download={`${studentName}-${courseName}-Certificate.png`}
					>
						Download Certificate
					</a>
				</PrimaryButton>
			</div>
		);
	}

	// Show error state if there was an error from fetcher
	if (fetcherData && !fetcherData.success) {
		return (
			<div className="space-y-4">
				<div className="text-center p-6 border border-red-200 rounded-lg bg-red-50">
					<div className="space-y-2">
						<AlertCircleIcon className="w-12 h-12 text-red-600 mx-auto" />
						<h3 className="text-lg font-semibold text-red-800">
							Certificate Generation Failed
						</h3>
						<p className="text-sm text-red-600">
							{fetcherData.message || "An error occurred while generating your certificate."}
						</p>
					</div>
				</div>
				<fetcher.Form method="post" action="/resource/certificate" className="w-full">
					<input type="hidden" name="intent" value="download-certificate" />
					<input type="hidden" name="studentId" value={studentId} />
					<input type="hidden" name="studentName" value={studentName} />
					<input type="hidden" name="courseName" value={courseName} />
					<input type="hidden" name="courseSlug" value={courseSlug} />
					<PrimaryButton type="submit" disabled={isSubmitting} className="w-full">
						{isSubmitting ? "Generating Certificate..." : "Try Again"}
					</PrimaryButton>
				</fetcher.Form>
			</div>
		);
	}

	// Show success message if certificate was just generated (from fetcher)
	if (fetcherData?.success && fetcherData.certificateUrl) {
		return (
			<div className="space-y-4">
				<div className="text-center p-6 border border-green-200 rounded-lg bg-green-50">
					<div className="space-y-3">
						<div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
							<span className="text-2xl">🎓</span>
						</div>
						<h3 className="text-xl font-semibold text-green-800">
							Certificate Generated Successfully!
						</h3>
						<p className="text-green-700">
							Your certificate for <strong>{courseName}</strong> is ready!
						</p>
						<p className="text-sm text-green-600">
							The page will refresh to show your download link.
						</p>
					</div>
				</div>
				<PrimaryButton 
					asChild 
					className="w-full"
				>
					<a 
						href={fetcherData.certificateUrl} 
						target="_blank" 
						rel="noopener noreferrer"
						download={`${studentName}-${courseName}-Certificate.png`}
					>
						Download Certificate
					</a>
				</PrimaryButton>
			</div>
		);
	}

	// Default state - show download button
	return (
		<fetcher.Form method="post" action="/resource/certificate" className="w-full">
			<input type="hidden" name="intent" value="download-certificate" />
			<input type="hidden" name="studentId" value={studentId} />
			<input type="hidden" name="studentName" value={studentName} />
			<input type="hidden" name="courseName" value={courseName} />
			<input type="hidden" name="courseSlug" value={courseSlug} />
			<PrimaryButton type="submit" disabled={isSubmitting} className="w-full">
				{isSubmitting ? "Generating Certificate..." : "Claim Certificate"}
			</PrimaryButton>
		</fetcher.Form>
	)
}
