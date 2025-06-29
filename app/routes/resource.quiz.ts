import { data } from "react-router";
import { type ActionFunctionArgs } from "react-router";
import {
	handleCreateQuiz,
	handleDeleteQuiz,
	handleUpdateQuiz,
} from "~/lib/admin/data-access/quiz/quiz.server";
const intents = ["create-quiz", "update-quiz", "delete-quiz"];

export async function loader() {
	return data("Not Allowed", { status: 405 });
}

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const intent = formData.get("intent") as string;

	if (!intent || !intents.includes(intent)) {
		return data(
			{ success: false, message: "Invalid form submission" },
			{ status: 400 },
		);
	}
	try {
		const handlers = {
			"create-quiz": handleCreateQuiz,
			"update-quiz": handleUpdateQuiz,
			"delete-quiz": handleDeleteQuiz,
		} as const;
		const handler = handlers[intent as keyof typeof handlers];
		return handler(request, formData);
	} catch (error) {
		console.error("Action error:", error);
		return data(
			{ success: false, message: "An unexpected error occurred" },
			{ status: 500 },
		);
	}
}
