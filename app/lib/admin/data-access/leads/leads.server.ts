import { isAdminLoggedIn } from "~/lib/auth/auth.server";
import { data, redirect } from "react-router";
import db from "~/db/index.server";
import { leadCaptureTable } from "~/db/schema";
import { desc } from "drizzle-orm";

export async function GetAllLeads(request: Request) {
    const { isLoggedIn } = await isAdminLoggedIn(request);
    if (!isLoggedIn) {
        throw redirect("/admin/login");
    }

    try {
        const leads = await db
            .select()
            .from(leadCaptureTable)
            .orderBy(desc(leadCaptureTable.createdAt));

        return {
            success: true,
            leads,
        };
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Failed to get leads";
        console.error("Error getting leads", errorMessage);
        return {
            success: false,
            leads: [],
        };
    }
}
