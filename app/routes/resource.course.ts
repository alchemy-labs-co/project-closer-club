import { data, redirect, type ActionFunctionArgs } from "react-router";
import {
	handleCreateCourse,
	handleDeleteCourse,
	handleEditCourse,
	handleMakePrivate,
	handleMakePublic,
	handleUpdateCourseAssignment,
} from "~/lib/admin/actions/course/course.server";

const intents = [
	"create-course",
	"edit-course",
	"delete-course",
	"make-public",
	"make-private",
	"update-course-assignment",
];
import type { Route } from "./+types/resource.course";
import { toast } from "sonner";

export async function loader() {
	return data("Not Allowed", { status: 405 });
}

export async function clientAction({ serverAction }: Route.ClientActionArgs) {
	const result:
		| {
				success: boolean;
				message: string;
				redirectToUrl?: string;
		  }
		| undefined = await serverAction();

	if (result?.success) {
		toast.success(result?.message);
		if (result?.redirectToUrl) {
			throw redirect(result?.redirectToUrl);
		}
	} else {
		toast.error(result?.message);
	}
	return result;
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
			"create-course": handleCreateCourse,
			"edit-course": handleEditCourse,
			"make-public": handleMakePublic,
			"make-private": handleMakePrivate,
			"delete-course": handleDeleteCourse,
			"update-course-assignment": handleUpdateCourseAssignment,
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
