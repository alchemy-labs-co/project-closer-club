import { eq } from "drizzle-orm";
import db from "~/db/index.server";
import { attachmentsTable, type Attachment } from "~/db/schema";
import { isTeamLeaderLoggedIn } from "~/lib/auth/auth.server";
import { redirect } from "react-router";

export async function getAttachmentsForLessonForTeamLeader(
	request: Request,
	lessonId: string,
): Promise<{ attachments: Attachment[] | null }> {
	const { isLoggedIn } = await isTeamLeaderLoggedIn(request);

	if (!isLoggedIn) {
		throw redirect("/team-leader/login");
	}

	try {
		const attachments = await db
			.select()
			.from(attachmentsTable)
			.where(eq(attachmentsTable.lessonId, lessonId));

		return { attachments: attachments.length > 0 ? attachments : null };
	} catch (error) {
		console.error("Error fetching attachments for lesson:", error);
		return { attachments: null };
	}
}
