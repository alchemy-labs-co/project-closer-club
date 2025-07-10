import { data, redirect } from "react-router";
import {
	handleCreateModule,
	handleDeleteModule,
	handleEditModule,
} from "~/lib/admin/actions/modules/modules.server";
import type { Route } from "./+types/resource.module";
import { toast } from "sonner";
import type { FetcherResponse } from "~/lib/types";
const intents = ["create-module", "delete-module", "edit-module"];

export async function loader() {
	return data("Not Allowed", { status: 405 });
}


export async function clientAction({ serverAction }: Route.ClientActionArgs) {
	const result: FetcherResponse = await serverAction();

	if (result.success) {
		toast.success(result.message);
		if (result.redirectTo) {
			throw redirect(result.redirectTo);
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
			"create-module": handleCreateModule,
			"delete-module": handleDeleteModule,
			"edit-module": handleEditModule,
		} as const;

		const handler = handlers[intent as keyof typeof handlers];
		return handler(request, formData);
	} catch (error) {
		console.error("Module action error:", error);
		return data(
			{ success: false, message: "An unexpected error occurred" },
			{ status: 500 },
		);
	}
}
