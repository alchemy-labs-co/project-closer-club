interface QuizQuestionProps {
	question: {
		title: string;
		answers: string[];
		correctAnswerIndex: number;
	};
	questionIndex: number;
	selectedAnswer: number | undefined;
	onAnswerSelect: (questionIndex: number, answerIndex: number) => void;
}

export function QuizQuestion({
	question,
	questionIndex,
	selectedAnswer,
	onAnswerSelect,
}: QuizQuestionProps) {
	return (
		<div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-white">
			<div className="space-y-3">
				<h4 className="font-medium text-gray-800">
					{questionIndex + 1}. {question.title}
				</h4>

				<div className="space-y-2">
					{question.answers.map((answer, answerIndex) => (
						<label
							key={answerIndex}
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
