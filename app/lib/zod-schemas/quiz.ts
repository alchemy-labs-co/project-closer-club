import { z } from "zod";

export const questionSchema = z.object({
    id: z.number(),
    title: z.string().min(1, { message: "Question title is required" }).trim(),
    correctAnswerIndex: z.number().min(0, { message: "Please select a correct answer" }),
    answers: z
        .array(z.string().min(1, { message: "Answer cannot be empty" }).trim())
        .min(2, { message: "At least 2 answers are required" })
        .max(6, { message: "Maximum 6 answers allowed" }),
});

export const quizSchema = z.object({
    lessonId: z.string().min(1, { message: "Lesson ID is required" }).trim(),
    questions: z
        .array(questionSchema)
        .min(1, { message: "At least one question is required" }),
});

export const insertQuizSchema = z.object({
    lessonId: z.string().min(1, { message: "Lesson ID is required" }).trim(),
    questions: z.array(questionSchema.omit({ id: true })).min(1, { message: "At least one question is required" }),
});

export const submitQuizSchema = z.object({
    quizId: z.string().min(1, { message: "Quiz ID is required" }).trim(),
    lessonId: z.string().min(1, { message: "Lesson ID is required" }).trim(),
    selectedAnswers: z.array(z.number()).min(1, { message: "At least one answer is required" }),
});

// Validation helper for checking if a question is complete
export const isQuestionComplete = (question: {
    title: string;
    answers: string[];
}) => {
    try {
        questionSchema.parse(question);
        return true;
    } catch {
        return false;
    }
};

// Types
export type QuestionSchema = z.infer<typeof questionSchema>;
export type QuizSchema = z.infer<typeof quizSchema>; 