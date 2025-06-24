import { isTeamLeaderLoggedIn } from "~/lib/auth/auth.server";
import { data, redirect } from "react-router";
import db from "~/db/index.server";
import { agentsTable, teamLeadersTable, studentCoursesTable, coursesTable } from "~/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export async function getAgentsForTeamLeader(request: Request) {
    const { isLoggedIn, teamLeader } = await isTeamLeaderLoggedIn(request);
    if (!isLoggedIn || !teamLeader) {
        throw redirect("/team-leader/login");
    }

    try {
        const [leader] = await db.select().from(teamLeadersTable).where(eq(teamLeadersTable.teamLeaderId, teamLeader.id)).limit(1)
        const agents = await db.select().from(agentsTable).where(eq(agentsTable.teamLeaderId, leader.id));

        return data({ success: true, data: agents, message: "Agents fetched successfully" }, { status: 200 });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to get agents";
        console.error("Error getting agents for team leader", errorMessage);
        return data(
            { success: false, message: errorMessage, data: [] },
            { status: 500 }
        );
    }
}

export async function getAgent(request: Request, studentId: string) {
    const { isLoggedIn, teamLeader } = await isTeamLeaderLoggedIn(request);
    if (!isLoggedIn || !teamLeader) {
        throw redirect("/team-leader/login");
    }

    try {
        // Get the team leader's database record
        const [leader] = await db.select().from(teamLeadersTable).where(eq(teamLeadersTable.teamLeaderId, teamLeader.id)).limit(1);

        if (!leader) {
            return data(
                { success: false, message: "Team leader not found", data: null },
                { status: 404 }
            );
        }

        // Get the agent, but only if they're assigned to this team leader
        const [agent] = await db
            .select()
            .from(agentsTable)
            .where(
                and(
                    eq(agentsTable.studentId, studentId),
                    eq(agentsTable.teamLeaderId, leader.id)
                )
            )
            .limit(1);

        if (!agent) {
            return data(
                { success: false, message: "Agent not found or not assigned to you", data: null },
                { status: 404 }
            );
        }

        return data({ success: true, data: agent, message: "Agent fetched successfully" }, { status: 200 });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to get agent";
        console.error("Error getting agent for team leader", errorMessage);
        return data(
            { success: false, message: errorMessage, data: null },
            { status: 500 }
        );
    }
}

export async function getAgentCourses(request: Request, studentId: string) {
    const { isLoggedIn, teamLeader } = await isTeamLeaderLoggedIn(request);
    if (!isLoggedIn || !teamLeader) {
        throw redirect("/team-leader/login");
    }

    try {
        // Get the team leader's database record
        const [leader] = await db.select().from(teamLeadersTable).where(eq(teamLeadersTable.teamLeaderId, teamLeader.id)).limit(1);

        if (!leader) {
            return data(
                { success: false, message: "Team leader not found", data: [] },
                { status: 404 }
            );
        }

        // Verify the agent is assigned to this team leader
        const [agent] = await db
            .select()
            .from(agentsTable)
            .where(
                and(
                    eq(agentsTable.studentId, studentId),
                    eq(agentsTable.teamLeaderId, leader.id)
                )
            )
            .limit(1);

        if (!agent) {
            return data(
                { success: false, message: "Agent not found or not assigned to you", data: [] },
                { status: 404 }
            );
        }

        // Get courses the agent is enrolled in
        const studentCourses = await db
            .select()
            .from(studentCoursesTable)
            .where(eq(studentCoursesTable.studentId, studentId));

        if (studentCourses.length === 0) {
            return data({ success: true, data: [], message: "No courses found for this agent" }, { status: 200 });
        }

        // Get the actual course details
        const courses = await db
            .select()
            .from(coursesTable)
            .where(
                and(
                    eq(coursesTable.isPublic, true),
                    inArray(
                        coursesTable.id,
                        studentCourses.map((course) => course.courseId)
                    )
                )
            );

        return data({ success: true, data: courses, message: "Agent courses fetched successfully" }, { status: 200 });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to get agent courses";
        console.error("Error getting agent courses for team leader", errorMessage);
        return data(
            { success: false, message: errorMessage, data: [] },
            { status: 500 }
        );
    }
}