import { data, type ActionFunctionArgs } from "react-router";
import { handleCreateModule, handleDeleteModule, handleEditModule } from "~/lib/admin/actions/modules/modules.server";

const intents = ["create-module", "delete-module", "edit-module"];

export async function loader() {
    return data("Not Allowed", { status: 405 });
}

export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const intent = formData.get("intent") as string;
    console.log("intent", intent);
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