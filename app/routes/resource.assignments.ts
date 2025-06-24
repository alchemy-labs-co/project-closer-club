import { data, type ActionFunctionArgs } from "react-router";
import { submitQuiz } from "~/lib/student/actions/assignments.server";

const intents = [
    "submit-quiz",
];

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

    const handlers = {
        "submit-quiz": submitQuiz,
    }

    const handler = handlers[intent as keyof typeof handlers];
    return handler(request, formData);
}
