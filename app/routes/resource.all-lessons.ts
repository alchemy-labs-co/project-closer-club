import { isAdminLoggedIn } from '~/lib/auth/auth.server';
import { data } from 'react-router';
import type { Route } from './+types/resource.all-lessons';
import db from '~/db/index.server';
import { desc } from 'drizzle-orm';
import { lessonsTable } from '~/db/schema';

export async function loader({ request }: Route.LoaderArgs) {

    try {
        const { isLoggedIn } = await isAdminLoggedIn(request);
        if (!isLoggedIn) {
            return data("Not Allowed", { status: 405 });
        }

        const lessons = await db.select().from(lessonsTable).orderBy(desc(lessonsTable.created_at));

        return data({ lessons }, { status: 200 });
    } catch (error) {
        console.error("🔴Error fetching all the lessons", error);
        return data(
            error instanceof Error ? error.message : "Something went wrong",
            { status: 500 },
        );
    }
}