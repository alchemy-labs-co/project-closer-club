import { data } from "react-router";
import { handleCreateWaitlist } from "~/lib/student/actions/waitlist.server";
import type { Route } from "./+types/resource.waitlist";

const intents = [
    "create-waitlist",
];

export async function loader() {
    return data("Not Allowed", { status: 405 });
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
            "create-waitlist": handleCreateWaitlist,
        } as const;

        const handler = handlers[intent as keyof typeof handlers];
        return handler(request, formData);
    } catch (error) {
        console.error("🔴Action error:", error);
        return data(
            { success: false, message: "An unexpected error occurred" },
            { status: 500 },
        );
    }
}