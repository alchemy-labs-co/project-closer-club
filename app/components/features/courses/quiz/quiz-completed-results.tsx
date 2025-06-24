import { CheckCircleIcon } from "lucide-react";
import type { Quiz } from "~/db/schema";

interface QuizCompletedResultsProps {
	quiz: Quiz | null;
	completedAssignment: {
		id: string;
		quizId: string;
		studentId: string | null;
		lessonId: string;
		selectedAnswers: number[] | null;
		numberOfQuestions: number;
		totalCorrectAnswers: number;
		createdAt: Date;
	};
}

export function QuizCompletedResults({
	quiz,
	completedAssignment,
}: QuizCompletedResultsProps) {
	const score = completedAssignment.totalCorrectAnswers;
	const totalQuestions = completedAssignment.numberOfQuestions;
	const selectedAnswers = completedAssignment.selectedAnswers || [];
	const questions = quiz?.questions || [];

	return (
		<div className="space-y-6">
			{/* Quiz Completed Success Screen */}
			<div className="text-center p-6 border rounded-lg">
				<div className="space-y-2">
					<CheckCircleIcon className="w-12 h-12 text-green-600 mx-auto" />
					<h3 className="text-xl font-semibold text-green-800">
						Quiz Completed!
					</h3>
					<p className="text-green-600">
						Score: {score}/{totalQuestions}
					</p>
					<p className="text-sm text-gray-600">
						You have successfully completed this quiz assignment.
					</p>
					<p className="text-xs text-gray-500">
						Completed on:{" "}
						{new Date(completedAssignment.createdAt).toLocaleDateString()}
					</p>
				</div>
			</div>

			{/* Show perfect score celebration */}
			{score === totalQuestions && (
				<div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
					<p className="text-green-800 font-medium">🎉 Perfect Score!</p>
					<p className="text-sm text-green-600">
						Excellent work! You got all questions correct.
					</p>
				</div>
			)}

			{/* Show quiz questions and answers for review */}
		</div>
	);
}
