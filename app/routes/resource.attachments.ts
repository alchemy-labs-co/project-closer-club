import { data } from "react-router";
import { toast } from "sonner";
import {
    createAttachment,
    deleteAttachment,
    updateAttachment,
    generateAttachmentUploadTokens,
    confirmAttachmentUploads,
} from "~/lib/admin/actions/segment/attachments.server";
import type { Route } from "./+types/resource.attachments";


const intents = [
    "create-attachment",
    "delete-attachment",
    "update-attachment",
    "generate-attachment-tokens",
    "confirm-attachment-uploads",
];

export async function loader() {
    return data("Not Allowed", { status: 405 });
}

export async function clientAction({ serverAction }: Route.ClientActionArgs) {
    const result = await serverAction();
    if (result && result.success) {
        toast.success(result.message);
    }
    if (result && !result.success) {
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
    const handlers = {
        "create-attachment": createAttachment,
        "delete-attachment": deleteAttachment,
        "update-attachment": updateAttachment,
        "generate-attachment-tokens": generateAttachmentUploadTokens,
        "confirm-attachment-uploads": confirmAttachmentUploads,
    }

    const handler = handlers[intent as keyof typeof handlers];
    return handler(request, formData);
}