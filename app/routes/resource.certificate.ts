import { data } from "react-router";
import { toast } from "sonner";
import { handleDownloadCertificate } from "~/lib/student/actions/certificate.server";
import type { FetcherResponse } from "~/lib/types";
import type { Route } from "./+types/resource.certificate";

const intents = ["download-certificate"];

export async function loader({ request }: Route.LoaderArgs) {
    return data("Not Allowed", { status: 405 });
}

export async function clientAction({ serverAction }: Route.ClientActionArgs) {
    const result: FetcherResponse = await serverAction();
    if (result.success) {
        toast.success(result.message);
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
            "download-certificate": handleDownloadCertificate,
        } as const;
        const handler = handlers[intent as keyof typeof handlers];
        return handler(request, formData);

    } catch (error) {
        console.error("Certificate action error:", error);
        return data(
            { success: false, message: "An unexpected error occurred" },
            { status: 500 },
        );
    }


}