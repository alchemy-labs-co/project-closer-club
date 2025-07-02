import { data, redirect } from "react-router";
import { handleCreateLeadCapture, handlePromoteLead, handleRejectLead } from "~/lib/student/actions/lead-capture";
import type { Route } from "./+types/resource.lead-capture";
import { toast } from "sonner";

const intents = [
    "create-lead-capture",
    "promote-lead",
    "reject-lead"
];

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
            "create-lead-capture": handleCreateLeadCapture,
            "promote-lead": handlePromoteLead,
            "reject-lead": handleRejectLead,
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