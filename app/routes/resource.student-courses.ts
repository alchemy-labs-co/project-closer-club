import { eq } from "drizzle-orm";
import { data } from "react-router";
import db from "~/db/index.server";
import { coursesTable } from "~/db/schema";
import { isAdminLoggedIn } from "~/lib/auth/auth.server";
import type { Route } from "./+types/resource.student-courses";

export async function loader({ request }: Route.LoaderArgs) {
	// load all the courses in the database
	const { isLoggedIn } = await isAdminLoggedIn(request);
	if (!isLoggedIn) {
		return data("Not Allowed", { status: 405 });
	}
	const courses = await db
		.select()
		.from(coursesTable)
		.where(eq(coursesTable.isPublic, true));
	if (!courses) {
		return { courses: [] };
	}
	return { courses };
}
