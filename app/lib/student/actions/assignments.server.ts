import { data, redirect } from "react-router";
import db from "~/db/index.server";
import { isAgentLoggedIn } from "~/lib/auth/auth.server";
import { completedQuizAssignmentsTable } from "~/db/schema";
import { submitQuizSchema } from "~/lib/zod-schemas/quiz";
import type { FetcherSubmitQuizResponse } from "~/lib/types";
import getQuizById from "../data-access/quiz.server";


const THRESHOLD = 0.5;

export async function submitQuiz(request: Request, formData: FormData) {
    const { isLoggedIn, student } = await isAgentLoggedIn(request);

    if (!isLoggedIn || !student) {
        throw redirect("/login")
    }
    try {

        const { quizId, lessonId, selectedAnswers } = Object.fromEntries(formData);

        const parsedSelectedAnswers = JSON.parse(selectedAnswers as string) as number[];

        const { data: unvalidatedFields, success: isFormDataValid } = submitQuizSchema.safeParse({ quizId, lessonId, selectedAnswers: parsedSelectedAnswers });

        if (!isFormDataValid) {
            return data({ success: false, message: "Invalid form submission" }, { status: 400 });
        }

        const validatedFields = unvalidatedFields;

        const { quiz } = await getQuizById(validatedFields.quizId);

        if (!quiz) {
            return data({ success: false, message: "Quiz not found" }, { status: 404 });
        }

        const { questions } = quiz;

        // compare answers with the correct answers
        const score = questions.reduce((acc, question, index) => {
            const selectedAnswer = parsedSelectedAnswers[index];
            const correctAnswer = question.correctAnswerIndex;
            return acc + (selectedAnswer === correctAnswer ? 1 : 0);
        }, 0);
        const hasPassedQuiz = score / questions.length >= THRESHOLD;
        const totalCorrectAnswers = score;

        if (!hasPassedQuiz) {
            // return detailed information about incorrect questions
            const incorrectQuestions = questions
                .map((question, index) => {
                    const selectedAnswer = parsedSelectedAnswers[index];
                    const isCorrect = selectedAnswer === question.correctAnswerIndex;

                    if (!isCorrect) {
                        return {
                            questionIndex: index,
                            question: question.title,
                            selectedAnswer,
                            correctAnswer: question.correctAnswerIndex,
                            answers: question.answers
                        };
                    }
                    return null;
                })
                .filter(Boolean) as NonNullable<FetcherSubmitQuizResponse['incorrectQuestions']>;

            return data({
                success: true,
                message: "Quiz submitted. Some answers were incorrect. Please try again.",
                passed: false,
                score,
                totalQuestions: questions.length,
                incorrectQuestions
            }, { status: 200 });
        }

        // submit the assignment to the database if they passed the threshold
        // insert the assigment to the database
        await db.insert(completedQuizAssignmentsTable).values({
            quizId: validatedFields.quizId,
            lessonId: validatedFields.lessonId,
            studentId: student.id,
            numberOfQuestions: questions.length,
            selectedAnswers: parsedSelectedAnswers,
            totalCorrectAnswers: totalCorrectAnswers,
        })

        return data({
            success: true,
            message: "Quiz passed successfully!",
            passed: true,
            score,
            totalQuestions: questions.length
        }, { status: 200 });

    } catch (error) {
        return data({ success: false, message: "Error submitting quiz" }, { status: 500 });
    }
}