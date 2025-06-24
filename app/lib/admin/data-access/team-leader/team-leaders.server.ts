import { count, desc, eq } from "drizzle-orm";
import { redirect } from "react-router";
import db from "~/db/index.server";
import { agentsTable, teamLeadersTable } from "~/db/schema";
import { isAdminLoggedIn } from "~/lib/auth/auth.server";

export async function GetAllTeamLeaders(request: Request) {
    const { isLoggedIn } = await isAdminLoggedIn(request);
    if (!isLoggedIn) {
        throw redirect("/admin/login");
    }
    try {
        const teamLeaders = await db
            .select()
            .from(teamLeadersTable)
            .orderBy(desc(teamLeadersTable.createdAt));
        return { success: true, teamLeaders };
    } catch (e) {
        console.error("🔴Error fetching team leaders from database:", e);
        return { success: false, teamLeaders: [] };
    }
}

export async function GetTeamLeadersAnalytics(request: Request) {
    const { isLoggedIn } = await isAdminLoggedIn(request);
    if (!isLoggedIn) {
        throw redirect("/admin/login");
    }
    try {
        const [totalTeamLeadersCount] = await db
            .select({ count: count() })
            .from(teamLeadersTable);
        const [activeTeamLeadersCount] = await db
            .select({ count: count() })
            .from(teamLeadersTable)
            .where(eq(teamLeadersTable.isActivated, true));
        return {
            success: true,
            totalTeamLeadersCount: totalTeamLeadersCount.count,
            activeTeamLeadersCount: activeTeamLeadersCount.count,
            inactiveTeamLeadersCount:
                totalTeamLeadersCount.count - activeTeamLeadersCount.count,
        };
    } catch (e) {
        console.error("🔴Error fetching team leaders analytics from database:", e);
        return {
            success: false,
            totalTeamLeadersCount: 0,
            activeTeamLeadersCount: 0,
            inactiveTeamLeadersCount: 0,
        };
    }
}

export async function GetTeamLeaderById(request: Request, teamLeaderId: string) {
    const { isLoggedIn } = await isAdminLoggedIn(request);
    if (!isLoggedIn) {
        throw redirect("/admin/login");
    }
    try {
        const [teamLeader] = await db
            .select()
            .from(teamLeadersTable)
            .where(eq(teamLeadersTable.id, teamLeaderId))
            .limit(1);
        return { success: true, teamLeader };
    } catch (e) {
        console.error("🔴Error fetching team leader from database:", e);
        return { success: false, teamLeader: null };
    }
}

export async function getAgentsAssignedToTeamLeader(
    request: Request,
    teamLeaderId: string,
) {
    // auth check
    const { isLoggedIn, admin } = await isAdminLoggedIn(request);
    if (!isLoggedIn) {
        throw redirect("/login");
    }
    if (!admin) {
        console.error("Admin not found");
        return { agents: [] };
    }
    try {
        // Get the team leader's internal ID first
        const [teamLeader] = await db
            .select({ id: teamLeadersTable.id })
            .from(teamLeadersTable)
            .where(eq(teamLeadersTable.id, teamLeaderId))
            .limit(1);

        if (!teamLeader) {
            return { agents: [] };
        }

        // Find all agents assigned to this team leader
        const agents = await db
            .select()
            .from(agentsTable)
            .where(eq(agentsTable.teamLeaderId, teamLeader.id));

        return { agents };
    } catch (error) {
        console.error(
            `Error fetching team leader agents: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        return { agents: [] };
    }
}

export async function getTeamLeaderAssignedToAgent(
    request: Request,
    studentId: string,
) {
    // auth check
    const { isLoggedIn, admin } = await isAdminLoggedIn(request);
    if (!isLoggedIn) {
        throw redirect("/login");
    }
    if (!admin) {
        console.error("Admin not found");
        return { teamLeader: null };
    }
    try {
        // Get the agent first
        const [agent] = await db
            .select()
            .from(agentsTable)
            .where(eq(agentsTable.studentId, studentId))
            .limit(1);

        if (!agent || !agent.teamLeaderId) {
            return { teamLeader: null };
        }

        // Get the team leader assigned to this agent
        // Fix: Use teamLeadersTable.id instead of teamLeaderId since agent.teamLeaderId references the internal id
        const [teamLeader] = await db
            .select()
            .from(teamLeadersTable)
            .where(eq(teamLeadersTable.id, agent.teamLeaderId))
            .limit(1);

        return { teamLeader: teamLeader || null };
    } catch (error) {
        console.error(
            `Error fetching agent's team leader: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        return { teamLeader: null };
    }
}