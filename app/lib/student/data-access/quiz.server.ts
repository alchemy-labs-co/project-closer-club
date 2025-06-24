import db from "~/db/index.server";
import { quizzesTable } from "~/db/schema";
import { eq } from "drizzle-orm";

export default async function getQuizById(quizId: string) {
    try {
        const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, quizId)).limit(1);
        return { success: true, quiz: quiz ?? null };
    } catch (error) {
        return { success: false, quiz: null };
    }
}