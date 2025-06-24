import { eq } from "drizzle-orm";
import { data, redirect } from "react-router";
import db from "~/db/index.server";
import { quizzesTable } from "~/db/schema";
import { isAdminLoggedIn } from "~/lib/auth/auth.server";
import { insertQuizSchema } from "~/lib/zod-schemas/quiz";
import type { Question } from "~/routes/_admin.dashboard.quizzes_.create";

export async function handleCreateQuiz(request: Request, formData: FormData) {
    const { isLoggedIn } = await isAdminLoggedIn(request);

    if (!isLoggedIn) {
        throw redirect("/admin/login")
    }

    try {
        const { questions, lessonId } = Object.fromEntries(formData) as unknown as { questions: string, lessonId: string };
        const parsedQuestions = JSON.parse(questions) as Question[];
        console.log(parsedQuestions);
        // format the questions to the correct format
        const formattedQuestions = parsedQuestions.map((question: Question) => ({
            title: question.title,
            answers: question.answers,
            correctAnswerIndex: question.correctAnswerIndex,
        }));

        const unvalidatedData = {
            lessonId: lessonId,
            questions: formattedQuestions,
        }

        const validatedData = insertQuizSchema.safeParse(unvalidatedData);

        if (!validatedData.success) {
            return data({ success: false, message: "Invalid form submission" }, { status: 400 });
        }

        // add the quiz to the database
        await db.insert(quizzesTable).values({
            lessonId: validatedData.data.lessonId,
            questions: validatedData.data.questions,
        });

        return data({ success: true, message: "Quiz created successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error creating quiz:", error);
        return data({ success: false, message: "An unexpected error occurred" }, { status: 500 });
    }

}

export async function handleUpdateQuiz(request: Request, formData: FormData) {
    const { isLoggedIn } = await isAdminLoggedIn(request);

    if (!isLoggedIn) {
        throw redirect("/admin/login")
    }

    try {
        const { questions, lessonId, quizId } = Object.fromEntries(formData) as unknown as { questions: string, lessonId: string, quizId: string };
        const parsedQuestions = JSON.parse(questions) as Question[];
        console.log(parsedQuestions);
        // format the questions to the correct format
        const formattedQuestions = parsedQuestions.map((question: Question) => ({
            title: question.title,
            answers: question.answers,
            correctAnswerIndex: question.correctAnswerIndex,
        }));

        // update the quiz in the database
        await db.update(quizzesTable).set({
            lessonId: lessonId,
            questions: formattedQuestions,
        }).where(eq(quizzesTable.id, quizId));

        return data({ success: true, message: "Quiz updated successfully" }, { status: 200 });

    } catch (error) {
        console.error("Error updating quiz:", error);
        return data({ success: false, message: "An unexpected error occurred" }, { status: 500 });
    }
}

export async function handleDeleteQuiz(request: Request, formData: FormData) {
    const { isLoggedIn } = await isAdminLoggedIn(request);

    if (!isLoggedIn) {
        throw redirect("/admin/login")
    }

    try {
        const { quizId } = Object.fromEntries(formData) as unknown as { quizId: string };
        await db.delete(quizzesTable).where(eq(quizzesTable.id, quizId));
        return data({ success: true, message: "Quiz deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting quiz:", error);
        return data({ success: false, message: "An unexpected error occurred" }, { status: 500 });
    }
}