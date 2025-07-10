import { data, redirect, type ActionFunctionArgs } from "react-router";
import {
	handleCreateSegment,
	handleDeleteSegment,
	handleEditSegment,
	handleGenerateUploadTokens,
	handleConfirmUploads,
} from "~/lib/admin/actions/segment/segment.server";
import { toast } from "sonner";
import type { Route } from "./+types/resource.segment";
import type { FetcherResponse } from "~/lib/types";

const intents = [
	"create-segment",
	"edit-segment",
	"delete-segment",
	"generate-upload-tokens",
	"confirm-uploads",
];

export async function loader() {
	return data("Not Allowed", { status: 405 });
}


export async function clientAction({ serverAction }: Route.ClientActionArgs) {
	const result: FetcherResponse = await serverAction();

	if (result.success) {
		toast.success(result.message);
		if (result.redirectTo) {
			redirect(result.redirectTo);
		}
	} else {
		toast.error(result.message);
	}
	return result;
}

export async function action({ request }: Route.ActionArgs) {
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
			"create-segment": handleCreateSegment,
			"edit-segment": handleEditSegment,
			"delete-segment": handleDeleteSegment,
			"generate-upload-tokens": handleGenerateUploadTokens,
			"confirm-uploads": handleConfirmUploads,
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
