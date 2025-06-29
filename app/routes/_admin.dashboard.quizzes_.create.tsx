import { eq } from "drizzle-orm";
import {
	AlertCircle,
	ArrowLeft,
	Check,
	Lightbulb,
	Loader2,
	XIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { data, Link, redirect, useFetcher, useNavigate } from "react-router";
import { toast } from "sonner";
import { SelectLesson } from "~/components/features/courses/quiz/select-lesson";
import PrimaryButton from "~/components/global/brand/primary-button";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import db from "~/db/index.server";
import { quizzesTable } from "~/db/schema";
import { type FetcherResponse } from "~/lib/types";
import { isQuestionComplete } from "~/lib/zod-schemas/quiz";
import type { Route } from "./+types/_admin.dashboard.quizzes_.create";

export type Question = {
	id: number;
	title: string;
	correctAnswerIndex: number;
	answers: string[];
};

export async function loader({ request }: Route.LoaderArgs) {
	// Check if we're editing an existing quiz
	const url = new URL(request.url);
	const quizId = url.searchParams.get("edit");
	const lessonId = url.searchParams.get("lessonId");

	if (quizId) {
		const [quiz] = await db
			.select()
			.from(quizzesTable)
			.where(eq(quizzesTable.id, quizId))
			.limit(1);

		if (!quiz) {
			throw redirect("/dashboard/quizzes");
		}

		return data(
			{
				quiz: quiz,
				isEditing: true,
				lessonId: lessonId,
			},
			{ status: 200 }
		);
	}

	return data(
		{
			quiz: null,
			isEditing: false,
			lessonId: lessonId,
		},
		{ status: 200 }
	);
}

export default function CreateQuizPage({ loaderData }: Route.ComponentProps) {
	const { quiz, isEditing, lessonId } = loaderData;

	// Convert existing quiz questions to our Question format if editing
	const getInitialQuestions = (): Question[] => {
		if (isEditing && quiz?.questions) {
			const questionsArray = quiz.questions as Question[];
			if (Array.isArray(questionsArray)) {
				return questionsArray.map((q: Question, index: number) => ({
					id: index + 1,
					title: q.title || "",
					correctAnswerIndex: q.correctAnswerIndex ?? -1,
					answers: Array.isArray(q.answers) ? q.answers : ["", ""],
				}));
			}
		}

		return [
			{
				id: 1,
				title: "",
				correctAnswerIndex: -1,
				answers: ["", ""],
			},
		];
	};

	const [questions, setQuestions] = useState<Question[]>(getInitialQuestions());

	return (
		<div className="relative min-h-screen">
			<div className="flex items-center flex-col gap-8 justify-center p-8 pb-32">
				<CreateQuizHeader isEditing={isEditing} quizId={quiz?.id} />
				<QuestionsList questions={questions} setQuestions={setQuestions} />
			</div>
			<PublishQuiz
				questions={questions}
				setQuestions={setQuestions}
				isEditing={isEditing}
				quizId={quiz?.id}
				defaultLessonId={lessonId || quiz?.lessonId}
			/>
			{/* Scroll mask at the bottom - contained within this component */}
			<div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10" />
		</div>
	);
}

function CreateQuizHeader({
	isEditing,
	quizId,
}: {
	isEditing: boolean;
	quizId?: string;
}) {
	return (
		<div className="max-w-2xl w-full mx-auto">
			<div className="flex items-center gap-4 mb-8">
				<Link
					to="/dashboard/quizzes"
					className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
				>
					<ArrowLeft className="w-4 h-4" />
					Back to Quizzes
				</Link>
			</div>

			<div className="text-center">
				{/* Icon */}
				<motion.div
					initial={{ opacity: 0, scale: 0.5 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.5, ease: "easeOut" }}
					className="flex justify-center mb-8"
				>
					<div className="bg-gradient-to-br from-brand-primary to-brand-primary/80 p-6 rounded-full shadow-lg">
						<Lightbulb className="w-12 h-12 text-white" />
					</div>
				</motion.div>

				{/* Title */}
				<motion.h1
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
					className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
				>
					{isEditing ? "Edit" : "Create Your"}{" "}
					<span className="bg-gradient-to-r from-brand-primary to-brand-primary/80 bg-clip-text text-transparent">
						Quiz
					</span>
				</motion.h1>

				{isEditing && quizId && (
					<motion.p
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
						className="text-gray-600"
					>
						Quiz ID: {quizId.slice(-8)}
					</motion.p>
				)}
			</div>
		</div>
	);
}

function QuestionsList({
	questions,
	setQuestions,
}: {
	questions: Question[];
	setQuestions: (questions: Question[]) => void;
}) {
	return (
		<div className="max-w-2xl mx-auto w-full">
			<div className="flex flex-col gap-8">
				{questions.map((question, index) => (
					<QuestionItem
						key={question.id}
						question={question}
						index={index}
						setQuestions={setQuestions}
						questions={questions}
					/>
				))}
				<AddQuestionButton setQuestions={setQuestions} questions={questions} />
			</div>
		</div>
	);
}

function QuestionItem({
	question,
	index,
	setQuestions,
	questions,
}: {
	question: Question;
	index: number;
	setQuestions: (questions: Question[]) => void;
	questions: Question[];
}) {
	const removeQuestion = (questionId: number) => {
		setQuestions(questions.filter((q) => q.id !== questionId));
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 50 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{
				duration: 0.5,
				delay: index * 0.1,
				ease: "easeOut",
			}}
		>
			<CreateQuestion
				question={question}
				setQuestions={setQuestions}
				questions={questions}
				removeQuestion={removeQuestion}
			/>
		</motion.div>
	);
}

function AddQuestionButton({
	setQuestions,
	questions,
}: {
	setQuestions: (questions: Question[]) => void;
	questions: Question[];
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 30 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{
				duration: 0.4,
				delay: questions.length * 0.1 + 0.2,
				ease: "easeOut",
			}}
		>
			<AddQuestion setQuestions={setQuestions} questions={questions} />
		</motion.div>
	);
}

function CreateQuestion({
	question,
	setQuestions,
	questions,
	removeQuestion,
}: {
	question: Question;
	setQuestions: (questions: Question[]) => void;
	questions: Question[];
	removeQuestion: (questionId: number) => void;
}) {
	const updateQuestion = (updates: Partial<Question>) => {
		setQuestions(
			questions.map((q) => (q.id === question.id ? { ...q, ...updates } : q))
		);
	};

	const addAnswer = () => {
		// Only allow adding new answer if all current answers are filled
		const allAnswersFilled = question.answers.every(
			(answer) => answer.trim().length > 0
		);
		if (allAnswersFilled && question.answers.length < 6) {
			const newAnswers = [...question.answers, ""];
			updateQuestion({ answers: newAnswers });
		}
	};

	const updateAnswer = (index: number, value: string) => {
		const newAnswers = question.answers.map((answer, i) =>
			i === index ? value : answer
		);
		updateQuestion({ answers: newAnswers });
	};

	const removeAnswer = (index: number) => {
		const newAnswers = question.answers.filter((_, i) => i !== index);
		updateQuestion({
			answers: newAnswers,
			// Reset correct answer if it was the removed answer or adjust index
			correctAnswerIndex:
				question.correctAnswerIndex === index
					? -1
					: question.correctAnswerIndex > index
					? question.correctAnswerIndex - 1
					: question.correctAnswerIndex,
		});
	};

	const setCorrectAnswer = (index: number) => {
		updateQuestion({ correctAnswerIndex: index });
	};

	return (
		<div className="flex flex-col gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-300 relative">
			{/* Remove Question Button */}
			{questions.length > 1 && (
				<motion.div
					className="absolute -top-4 -right-4"
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
				>
					<Button
						type="button"
						variant="destructive"
						size="sm"
						onClick={() => removeQuestion(question.id)}
						className="transition-all hover:bg-white/80 bg-white shadow-sm flex items-center justify-center duration-200 rounded-full cursor-pointer w-8 h-8"
					>
						<XIcon className="w-4 h-4 text-red-500" />
					</Button>
				</motion.div>
			)}

			<QuestionTitle question={question} updateQuestion={updateQuestion} />

			<AnswersList
				question={question}
				updateAnswer={updateAnswer}
				removeAnswer={removeAnswer}
				setCorrectAnswer={setCorrectAnswer}
				addAnswer={addAnswer}
			/>

			<CorrectAnswerIndicator question={question} />
		</div>
	);
}

function QuestionTitle({
	question,
	updateQuestion,
}: {
	question: Question;
	updateQuestion: (updates: Partial<Question>) => void;
}) {
	return (
		<div className="flex flex-col gap-2">
			<Label htmlFor={`question-${question.id}`}>Question</Label>
			<motion.div whileFocus={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
				<Input
					type="text"
					id={`question-${question.id}`}
					value={question.title}
					onChange={(e) => updateQuestion({ title: e.target.value })}
					className="border border-gray-300 rounded-md p-2 transition-all duration-200 focus:ring-2 focus:ring-brand-primary/20"
					placeholder="Enter question"
				/>
			</motion.div>
		</div>
	);
}

function AnswersList({
	question,
	updateAnswer,
	removeAnswer,
	setCorrectAnswer,
	addAnswer,
}: {
	question: Question;
	updateAnswer: (index: number, value: string) => void;
	removeAnswer: (index: number) => void;
	setCorrectAnswer: (index: number) => void;
	addAnswer: () => void;
}) {
	return (
		<div className="flex flex-col gap-3">
			<Label>Answers</Label>
			<div className="space-y-3">
				{question.answers.map((answer, index) => (
					<AnswerItem
						key={index}
						answer={answer}
						index={index}
						question={question}
						updateAnswer={updateAnswer}
						removeAnswer={removeAnswer}
						setCorrectAnswer={setCorrectAnswer}
					/>
				))}
			</div>

			<motion.div
				whileHover={
					question.answers.every((answer) => answer.trim().length > 0) &&
					question.answers.length < 6
						? { scale: 1.02 }
						: {}
				}
				whileTap={
					question.answers.every((answer) => answer.trim().length > 0) &&
					question.answers.length < 6
						? { scale: 0.98 }
						: {}
				}
				className="w-fit"
			>
				<PrimaryButton
					onClick={addAnswer}
					disabled={
						!question.answers.every((answer) => answer.trim().length > 0) ||
						question.answers.length >= 6
					}
					className={`w-fit transition-all duration-200 ${
						!question.answers.every((answer) => answer.trim().length > 0) ||
						question.answers.length >= 6
							? "opacity-50 cursor-not-allowed"
							: ""
					}`}
				>
					Add Answer {question.answers.length >= 6 ? "(Max 6)" : ""}
				</PrimaryButton>
			</motion.div>
		</div>
	);
}

function AnswerItem({
	answer,
	index,
	question,
	updateAnswer,
	removeAnswer,
	setCorrectAnswer,
}: {
	answer: string;
	index: number;
	question: Question;
	updateAnswer: (index: number, value: string) => void;
	removeAnswer: (index: number) => void;
	setCorrectAnswer: (index: number) => void;
}) {
	return (
		<motion.div
			className="flex items-center gap-3"
			initial={{ opacity: 0, x: -20 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.3, delay: index * 0.05 }}
			exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
		>
			<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
				<Button
					type="button"
					variant={
						question.correctAnswerIndex === index ? "default" : "outline"
					}
					size="sm"
					onClick={() => setCorrectAnswer(index)}
					className="shrink-0 transition-all duration-200 rounded-full cursor-pointer h-8 w-8 bg-white hover:bg-white"
					disabled={!answer.trim()}
				>
					{question.correctAnswerIndex === index ? (
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ duration: 0.2 }}
						>
							<Check className="w-4 h-4 text-brand-primary" />
						</motion.div>
					) : (
						<span className="w-4 h-4 flex items-center justify-center text-xs">
							{index + 1}
						</span>
					)}
				</Button>
			</motion.div>
			<div className="flex-1 flex gap-2">
				<motion.div
					className="flex-1"
					whileFocus={{ scale: 1.02 }}
					transition={{ duration: 0.2 }}
				>
					<Input
						type="text"
						value={answer}
						onChange={(e) => updateAnswer(index, e.target.value)}
						placeholder={`Answer ${index + 1}`}
						className="flex-1 transition-all duration-200 focus:ring-2 focus:ring-brand-primary/20"
					/>
				</motion.div>
				{question.answers.length > 1 && (
					<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
						<Button
							type="button"
							variant="destructive"
							size="sm"
							onClick={() => removeAnswer(index)}
							className="transition-all flex items-center hover:bg-white/80 bg-white shadow-sm justify-center duration-200 rounded-full cursor-pointer w-8 h-8"
						>
							<XIcon className="w-4 h-4 text-red-500" />
						</Button>
					</motion.div>
				)}
			</div>
		</motion.div>
	);
}

function CorrectAnswerIndicator({ question }: { question: Question }) {
	if (
		question.correctAnswerIndex === -1 ||
		!question.answers[question.correctAnswerIndex]
	) {
		return (
			<motion.div
				className="text-sm text-amber-600 bg-amber-50 p-2 rounded-md border border-amber-200"
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
			>
				⚠️ Please select a correct answer
			</motion.div>
		);
	}

	return (
		<motion.div
			className="text-sm text-green-600 bg-green-50 p-2 rounded-md border border-green-200"
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
		>
			✅ Your Selected Answer: {question.answers[question.correctAnswerIndex]}
		</motion.div>
	);
}

function AddQuestion({
	setQuestions,
	questions,
}: {
	setQuestions: (questions: Question[]) => void;
	questions: Question[];
}) {
	// Check if all existing questions are complete
	const allQuestionsComplete = questions.every((question) =>
		isQuestionComplete(question)
	);

	// Get incomplete questions for error display
	const incompleteQuestions = questions.filter(
		(question) => !isQuestionComplete(question)
	);

	const handleAddQuestion = () => {
		if (allQuestionsComplete) {
			setQuestions([
				...questions,
				{
					id: questions.length + 1,
					title: "",
					correctAnswerIndex: -1,
					answers: ["", ""],
				},
			]);
		}
	};

	return (
		<div className="flex flex-col items-center gap-3">
			<motion.div
				whileHover={allQuestionsComplete ? { scale: 1.02 } : {}}
				whileTap={allQuestionsComplete ? { scale: 0.98 } : {}}
				className="flex justify-center"
			>
				<PrimaryButton
					onClick={handleAddQuestion}
					disabled={!allQuestionsComplete}
					className={`transition-all duration-200 shadow-md hover:shadow-lg ${
						!allQuestionsComplete ? "opacity-50 cursor-not-allowed" : ""
					}`}
				>
					+ Add Question
				</PrimaryButton>
			</motion.div>

			{!allQuestionsComplete && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200 max-w-md text-center"
				>
					<AlertCircle className="w-4 h-4 shrink-0" />
					<span>
						Please complete all questions before adding new ones. Check that
						each question has a title and at least 2 non-empty answers.
					</span>
				</motion.div>
			)}
		</div>
	);
}

function PublishQuiz({
	questions,
	setQuestions,
	isEditing,
	quizId,
	defaultLessonId,
}: {
	questions: Question[];
	setQuestions: (questions: Question[]) => void;
	isEditing: boolean;
	quizId?: string;
	defaultLessonId?: string;
}) {
	const [selectedLessonId, setSelectedLessonId] = useState<string | null>(
		defaultLessonId ?? null
	);
	const fetcher = useFetcher<FetcherResponse>();
	const navigate = useNavigate();

	// Check if all questions are complete
	const allQuestionsComplete = questions.every((question) =>
		isQuestionComplete(question)
	);

	// Check if there's at least one question
	const hasQuestions = questions.length > 0;

	// Can publish only if there are questions and all are complete
	const canPublish = hasQuestions && allQuestionsComplete;

	const handlePublish = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!canPublish) {
			toast.error(
				"Please complete all questions and select a lesson to publish"
			);
			return;
		}

		const formData: {
			questions: string;
			lessonId: string | null;
			intent: string;
			quizId?: string;
		} = {
			questions: JSON.stringify(questions),
			lessonId: selectedLessonId,
			intent: isEditing ? "update-quiz" : "create-quiz",
		};

		// Add quiz ID for updates
		if (isEditing && quizId) {
			formData.quizId = quizId;
		}

		fetcher.submit(formData, {
			method: "POST",
			action: "/resource/quiz",
		});
	};

	useEffect(() => {
		if (fetcher.data) {
			if (fetcher.data.success) {
				toast.success(
					isEditing
						? "Quiz updated successfully"
						: "Quiz published successfully"
				);
				navigate("/dashboard/quizzes");
			} else {
				toast.error(
					isEditing ? "Failed to update quiz" : "Failed to publish quiz"
				);
			}
		}
	}, [fetcher.data, isEditing]);

	const isPending = fetcher.state !== "idle";

	// If we have a defaultLessonId (came from lesson page), show direct publish button
	if (defaultLessonId) {
		return (
			<div className="fixed bottom-26 right-16 flex flex-col items-end gap-3">
				{!canPublish && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200 max-w-xs text-right"
					>
						<AlertCircle className="w-4 h-4 shrink-0" />
						<span>
							{!hasQuestions
								? "Add at least one question to publish"
								: "Complete all questions to publish"}
						</span>
					</motion.div>
				)}
				<motion.div
					whileHover={canPublish && !isPending ? { scale: 1.02 } : {}}
					whileTap={canPublish && !isPending ? { scale: 0.98 } : {}}
				>
					<fetcher.Form
						action="/resource/quiz"
						method="POST"
						onSubmit={handlePublish}
					>
						<PrimaryButton
							type="submit"
							disabled={!canPublish || isPending}
							className={`min-w-[150px] transition-all duration-200 ${
								!canPublish ? "opacity-50 cursor-not-allowed" : ""
							}`}
						>
							{isPending ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin" />
									Publishing...
								</>
							) : (
								<>
									<Check className="w-4 h-4" />
									{isEditing ? "Update" : "Publish"}
								</>
							)}
						</PrimaryButton>
					</fetcher.Form>
				</motion.div>
			</div>
		);
	}

	// Otherwise, show dialog for lesson selection
	return (
		<Dialog>
			<DialogTrigger asChild>
				<div className="fixed bottom-26 right-16 flex flex-col items-end gap-3">
					{!canPublish && (
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200 max-w-xs text-right"
						>
							<AlertCircle className="w-4 h-4 shrink-0" />
							<span>
								{!hasQuestions
									? "Add at least one question to publish"
									: "Complete all questions to publish"}
							</span>
						</motion.div>
					)}
					<motion.div
						whileHover={canPublish && !isPending ? { scale: 1.02 } : {}}
						whileTap={canPublish && !isPending ? { scale: 0.98 } : {}}
					>
						<PrimaryButton
							type="button"
							disabled={!canPublish || isPending}
							className={`min-w-[150px] transition-all duration-200 ${
								!canPublish ? "opacity-50 cursor-not-allowed" : ""
							}`}
						>
							<Check className="w-4 h-4" />
							{isEditing ? "Update" : "Publish"}
						</PrimaryButton>
					</motion.div>
				</div>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{isEditing ? "Update Quiz" : "Publish Quiz"}
					</DialogTitle>
					<DialogDescription>
						Select the lesson to {isEditing ? "update" : "publish"} the quiz to.
					</DialogDescription>
					<fetcher.Form
						action="/resource/quiz"
						method="POST"
						className="w-full flex flex-col gap-4"
						onSubmit={handlePublish}
					>
						<SelectLesson
							selectedLessonId={selectedLessonId ?? undefined}
							onLessonSelect={setSelectedLessonId}
						/>

						<PrimaryButton
							type="submit"
							disabled={!canPublish || isPending || !selectedLessonId}
							className={`min-w-[150px] w-full transition-all duration-200 ${
								!canPublish || !selectedLessonId
									? "opacity-50 cursor-not-allowed"
									: ""
							}`}
						>
							{isPending ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<>
									<Check className="w-4 h-4" />
									{isEditing ? "Update" : "Publish"}
								</>
							)}
						</PrimaryButton>
					</fetcher.Form>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	);
}
