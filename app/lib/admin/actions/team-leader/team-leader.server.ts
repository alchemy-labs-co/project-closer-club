import { eq } from "drizzle-orm";
import { data, redirect } from "react-router";
import db from "~/db/index.server";
import {
    account,
    session,
    teamLeadersTable,
    agentsTable,
    user,
} from "~/db/schema";
import {
    createTeamLeaderSchema,
    updateTeamLeaderPasswordSchema,
    updateTeamLeaderSchema,
} from "~/lib/zod-schemas/team-leader";
import { auth, isAdminLoggedIn } from "~/lib/auth/auth.server";
import { DeleteAllExistingAuthSessions } from "~/lib/admin/actions/auth/auth.server";

export async function handleCreateTeamLeader(
    request: Request,
    formData: FormData,
) {
    // admin auth check
    const { isLoggedIn } = await isAdminLoggedIn(request);

    if (!isLoggedIn) {
        throw redirect("/admin/login");
    }

    const { name, email, phoneNumber, password } = Object.fromEntries(formData);
    const agents = formData.get("agents") as string;
    const agentsArray = agents ? agents.split(",") : [];

    // validate the data
    const unvalidatedFields = createTeamLeaderSchema.safeParse({
        name,
        email,
        phoneNumber,
        password,
        agents: agentsArray,
    });

    if (!unvalidatedFields.success) {
        return data(
            { success: false, message: "Invalid form data" },
            { status: 400 },
        );
    }

    const validatedFields = unvalidatedFields.data;
    // check if the email is already in use
    const [existingTeamLeader] = await db
        .select()
        .from(teamLeadersTable)
        .where(eq(teamLeadersTable.email, validatedFields.email))
        .limit(1);

    if (existingTeamLeader) {
        return data(
            { success: false, message: "Email already in use" },
            { status: 400 },
        );
    }

    try {
        await db.transaction(async (tx) => {
            // create user with better auth
            const { user } = await auth.api.createUser({
                body: {
                    email: validatedFields.email,
                    password: validatedFields.password,
                    name: validatedFields.name,
                    // @ts-ignore
                    role: "team_leader",
                },
            });

            // insert into team leaders table
            const [insertedTeamLeader] = await tx
                .insert(teamLeadersTable)
                .values({
                    name: validatedFields.name,
                    email: validatedFields.email,
                    phone: validatedFields.phoneNumber,
                    teamLeaderId: user.id,
                })
                .returning({
                    id: teamLeadersTable.id,
                });

            if (!insertedTeamLeader) {
                throw new Error("Something went wrong");
            }

            if (agentsArray.length > 0) {
                await tx
                    .update(agentsTable)
                    .set({ teamLeaderId: insertedTeamLeader.id })
                    .where(eq(agentsTable.studentId, agentsArray[0])); // Update this logic as needed
            }
        });

        return data(
            { success: true, message: "Team leader created successfully" },
            { status: 200 },
        );
    } catch (error) {
        return data(
            {
                success: false,
                message:
                    error instanceof Error ? error.message : "Something went wrong",
            },
            { status: 500 },
        );
    }
}

export async function handleDeleteTeamLeader(
    request: Request,
    formData: FormData,
) {
    // admin auth check
    const { isLoggedIn } = await isAdminLoggedIn(request);
    if (!isLoggedIn) {
        throw redirect("/admin/login");
    }

    const { teamLeaderId } = Object.fromEntries(formData);

    if (!teamLeaderId || typeof teamLeaderId !== "string") {
        return data(
            { success: false, message: "Team Leader ID is required" },
            { status: 400 },
        );
    }

    try {
        await db.transaction(async (tx) => {
            const [teamLeader] = await tx
                .select()
                .from(teamLeadersTable)
                .where(eq(teamLeadersTable.teamLeaderId, teamLeaderId))
                .limit(1);

            if (!teamLeader) {
                return data(
                    { success: false, message: "Team leader not found" },
                    { status: 404 },
                );
            }
            // First, unassign all agents from this team leader
            await tx
                .update(agentsTable)
                .set({ teamLeaderId: null })
                .where(eq(agentsTable.teamLeaderId, teamLeader.id));

            // erase user data across the system
            await tx.delete(user).where(eq(user.id, teamLeader.teamLeaderId));
            await tx.delete(account).where(eq(account.userId, teamLeader.teamLeaderId));
            await tx.delete(session).where(eq(session.userId, teamLeader.teamLeaderId));
            await tx
                .delete(teamLeadersTable)
                .where(eq(teamLeadersTable.teamLeaderId, teamLeader.teamLeaderId));
        });

        return data(
            { success: true, message: "Team leader deleted successfully" },
            { status: 200 },
        );
    } catch (error) {
        console.error(
            "🔴Error deleting team leader:",
            error instanceof Error && error.message,
        );
        return data(
            {
                success: false,
                message:
                    error instanceof Error ? error.message : "Something went wrong",
            },
            { status: 500 },
        );
    }
}

export async function handleActivateTeamLeader(
    request: Request,
    formData: FormData,
) {
    // admin auth check
    const { isLoggedIn } = await isAdminLoggedIn(request);
    if (!isLoggedIn) {
        throw redirect("/admin/login");
    }
    const { teamLeaderId } = Object.fromEntries(formData);

    if (!teamLeaderId || typeof teamLeaderId !== "string") {
        return data(
            { success: false, message: "Team Leader ID is required" },
            { status: 400 },
        );
    }

    try {
        const [updatedTeamLeader] = await db
            .update(teamLeadersTable)
            .set({
                isActivated: true,
            })
            .where(eq(teamLeadersTable.teamLeaderId, teamLeaderId))
            .returning({
                id: teamLeadersTable.teamLeaderId,
            });

        if (!updatedTeamLeader) {
            return data(
                { success: false, message: "Team leader not found" },
                { status: 404 },
            );
        }

        return data(
            { success: true, message: "Team leader activated successfully" },
            { status: 200 },
        );
    } catch (error) {
        console.error(
            "🔴Error activating team leader:",
            error instanceof Error && error.message,
        );
        return data(
            {
                success: false,
                message:
                    error instanceof Error ? error.message : "Something went wrong",
            },
            { status: 500 },
        );
    }
}

export async function handleDeactivateTeamLeader(
    request: Request,
    formData: FormData,
) {
    // admin auth check
    const { isLoggedIn } = await isAdminLoggedIn(request);
    if (!isLoggedIn) {
        throw redirect("/admin/login");
    }
    const { teamLeaderId } = Object.fromEntries(formData);

    if (!teamLeaderId || typeof teamLeaderId !== "string") {
        return data(
            { success: false, message: "Team Leader ID is required" },
            { status: 400 },
        );
    }

    try {
        await DeleteAllExistingAuthSessions(teamLeaderId);

        const [updatedTeamLeader] = await db
            .update(teamLeadersTable)
            .set({
                isActivated: false,
            })
            .where(eq(teamLeadersTable.teamLeaderId, teamLeaderId))
            .returning({
                id: teamLeadersTable.teamLeaderId,
            });

        if (!updatedTeamLeader) {
            return data(
                { success: false, message: "Team leader not found" },
                { status: 404 },
            );
        }

        return data(
            { success: true, message: "Team leader deactivated successfully" },
            { status: 200 },
        );
    } catch (error) {
        console.error(
            "🔴Error deactivating team leader:",
            error instanceof Error && error.message,
        );
        return data(
            {
                success: false,
                message:
                    error instanceof Error ? error.message : "Something went wrong",
            },
            { status: 500 },
        );
    }
}

export async function handleUpdateTeamLeader(
    request: Request,
    formData: FormData,
) {
    // admin auth check
    const { isLoggedIn } = await isAdminLoggedIn(request);
    if (!isLoggedIn) {
        throw redirect("/admin/login");
    }

    const { name, email, phoneNumber, teamLeaderId } =
        Object.fromEntries(formData);

    // validate the data
    const unvalidatedFields = updateTeamLeaderSchema.safeParse({
        name,
        email,
        phoneNumber,
    });

    if (!unvalidatedFields.success) {
        return data(
            { success: false, message: "Invalid form data" },
            { status: 400 },
        );
    }

    const validatedFields = unvalidatedFields.data;

    if (!teamLeaderId || typeof teamLeaderId !== "string") {
        return data(
            { success: false, message: "Team Leader ID is required" },
            { status: 400 },
        );
    }

    // check if the email is already in use by another team leader
    const [existingTeamLeader] = await db
        .select()
        .from(teamLeadersTable)
        .where(eq(teamLeadersTable.email, validatedFields.email))
        .limit(1);

    if (
        existingTeamLeader &&
        existingTeamLeader.teamLeaderId !== teamLeaderId
    ) {
        return data(
            { success: false, message: "Email already in use" },
            { status: 400 },
        );
    }

    try {
        await db.transaction(async (tx) => {
            // update team leader details
            const [updatedTeamLeader] = await tx
                .update(teamLeadersTable)
                .set({
                    name: validatedFields.name,
                    email: validatedFields.email,
                    phone: validatedFields.phoneNumber,
                })
                .where(eq(teamLeadersTable.teamLeaderId, teamLeaderId))
                .returning({
                    id: teamLeadersTable.teamLeaderId,
                });

            if (!updatedTeamLeader) {
                throw new Error("Team leader not found");
            }

            // update user table
            await tx
                .update(user)
                .set({
                    name: validatedFields.name,
                    email: validatedFields.email,
                    phone: validatedFields.phoneNumber,
                })
                .where(eq(user.id, teamLeaderId));
        });

        return data(
            { success: true, message: "Team leader updated successfully" },
            { status: 200 },
        );
    } catch (error) {
        console.error(
            "🔴Error updating team leader:",
            error instanceof Error && error.message,
        );
        return data(
            {
                success: false,
                message:
                    error instanceof Error ? error.message : "Something went wrong",
            },
            { status: 500 },
        );
    }
}

export async function handleUpdateTeamLeaderPassword(
    request: Request,
    formData: FormData,
) {
    // admin auth check
    const { isLoggedIn } = await isAdminLoggedIn(request);
    if (!isLoggedIn) {
        throw redirect("/admin/login");
    }

    const { password, teamLeaderId } = Object.fromEntries(formData);

    // validate the data
    const unvalidatedFields = updateTeamLeaderPasswordSchema.safeParse({
        password,
    });

    if (!unvalidatedFields.success) {
        return data(
            { success: false, message: "Invalid form data" },
            { status: 400 },
        );
    }

    const validatedFields = unvalidatedFields.data;

    if (!teamLeaderId || typeof teamLeaderId !== "string") {
        return data(
            { success: false, message: "Team Leader ID is required" },
            { status: 400 },
        );
    }

    try {
        // update password using better auth (similar to student password update)
        await db.transaction(async (tx) => {
            const ctx = await auth.$context;
            const hash = await ctx.password.hash(validatedFields.password);
            await ctx.internalAdapter.updatePassword(teamLeaderId, hash);
            await DeleteAllExistingAuthSessions(teamLeaderId);
        });

        return data(
            { success: true, message: "Team leader's Password updated successfully" },
            { status: 200 },
        );
    } catch (error) {
        console.error(
            "🔴Error updating team leader's password:",
            error instanceof Error && error.message,
        );
        return data(
            {
                success: false,
                message:
                    error instanceof Error ? error.message : "Something went wrong",
            },
            { status: 500 },
        );
    }
}

export async function handleUpdateAgentAssignment(
    request: Request,
    formData: FormData,
) {
    // admin auth check
    const { isLoggedIn } = await isAdminLoggedIn(request);
    if (!isLoggedIn) {
        throw redirect("/admin/login");
    }

    const { teamLeaderId, studentId, isAssigned } = Object.fromEntries(formData);

    if (!teamLeaderId || typeof teamLeaderId !== "string") {
        return data(
            { success: false, message: "Team Leader ID is required" },
            { status: 400 },
        );
    }

    if (!studentId || typeof studentId !== "string") {
        return data(
            { success: false, message: "Student ID is required" },
            { status: 400 },
        );
    }

    try {
        // Get the team leader's internal ID first
        const [teamLeader] = await db
            .select({ id: teamLeadersTable.id })
            .from(teamLeadersTable)
            .where(eq(teamLeadersTable.teamLeaderId, teamLeaderId))
            .limit(1);

        if (!teamLeader) {
            return data(
                { success: false, message: "Team leader not found" },
                { status: 404 },
            );
        }

        // Update agent assignment
        if (isAssigned === "true") {
            // Assign agent to team leader
            await db
                .update(agentsTable)
                .set({ teamLeaderId: teamLeader.id })
                .where(eq(agentsTable.studentId, studentId));
        } else {
            // Unassign agent from team leader
            await db
                .update(agentsTable)
                .set({ teamLeaderId: null })
                .where(eq(agentsTable.studentId, studentId));
        }

        return data(
            {
                success: true,
                message: isAssigned === "true" ? "Agent assigned successfully" : "Agent unassigned successfully"
            },
            { status: 200 },
        );
    } catch (error) {
        console.error(
            "🔴Error updating agent assignment:",
            error instanceof Error && error.message,
        );
        return data(
            {
                success: false,
                message:
                    error instanceof Error ? error.message : "Something went wrong",
            },
            { status: 500 },
        );
    }
} 