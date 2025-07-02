import { auth, isAdminLoggedIn } from '~/lib/auth/auth.server';

import { eq, inArray, type ExtractTablesWithRelations } from "drizzle-orm";
import { createCookie, data, redirect } from "react-router";
import db from "~/db/index.server";
import { agentsTable, leadCaptureTable, teamLeadersTable } from "~/db/schema";
import { leadCaptureSchema, promoteLeadSchema, type PromoteLeadSchemaType } from "~/lib/zod-schemas/lead-capture";
import type { TransactionSql } from 'postgres';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';

export async function handleCreateLeadCapture(request: Request, formData: FormData) {
    try {
        const { email, firstName, lastName, phoneNumber, stateOfResidence, areYouOver18, doYouHaveAnyFeloniesOrMisdemeanors } = Object.fromEntries(formData)
        console.log(email, firstName, lastName, phoneNumber, stateOfResidence, areYouOver18, doYouHaveAnyFeloniesOrMisdemeanors);
        //    check if the email contains the allowed domains
        const unvalidatedFields = leadCaptureSchema.safeParse({ email, firstName, lastName, phoneNumber, stateOfResidence, areYouOver18: areYouOver18 === "true", doYouHaveAnyFeloniesOrMisdemeanors: doYouHaveAnyFeloniesOrMisdemeanors === "true" });
        if (!unvalidatedFields.success) {
            return {
                success: false,
                message: "Invalid form data",
            }
        }
        const validatedFields = unvalidatedFields.data;
        // check if the email is already in the waitlist
        const [existingLead] = await db.select().from(leadCaptureTable).where(eq(leadCaptureTable.email, validatedFields.email));
        if (existingLead) {
            return {
                success: false,
                message: "Email already in waitlist",
            }
        }

        const [insertedLead] = await db.insert(leadCaptureTable).values({
            email: validatedFields.email,
            firstName: validatedFields.firstName,
            lastName: validatedFields.lastName,
            phoneNumber: validatedFields.phoneNumber,
            stateOfResidence: validatedFields.stateOfResidence,
            areYouOver18: validatedFields.areYouOver18,
            doYouHaveAnyFeloniesOrMisdemeanors: validatedFields.doYouHaveAnyFeloniesOrMisdemeanors,
        }).returning({ id: leadCaptureTable.id });

        if (!insertedLead.id) {
            return {
                success: false,
                message: "Error creating waitlist entry",
            }
        }
        // throw error;
        // set cookie
        const leadCaptureCookie = createCookie("lead-capture", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 30, // 30 days   
            sameSite: "lax",
        });

        return data({
            success: true,
            message: "Lead capture created successfully",
        }, {
            headers: {
                "Set-Cookie": await leadCaptureCookie.serialize(insertedLead.id),
            },
        });
    } catch (error) {
        console.error("Error creating lead capture entry", error);
        return {
            success: false,
            message: "Error creating lead capture entry",
        }
    }

}

export async function handlePromoteLead(request: Request, formData: FormData) {

    try {
        const { isLoggedIn } = await isAdminLoggedIn(request);

        if (!isLoggedIn) {
            throw redirect("/admin/login");
        }

        const { leadId, userType, name, email, password, phoneNumber } = Object.fromEntries(formData);
        const agents = formData.get("agents") as string;
        const agentsArray = agents ? agents.split(",") : [];

        const unvalidatedFields = promoteLeadSchema.safeParse({ leadId, userType, name, email, password, phoneNumber, agents: agentsArray });

        if (!unvalidatedFields.success) {
            return {
                success: false,
                message: "Invalid form data",
            }
        }
        const validatedFields = unvalidatedFields.data;

        await db.transaction(async (tx) => {
            // we will update the leadCapture status to "promoted",
            await tx.update(leadCaptureTable).set({
                leadStatus: "promoted" as const,
            }).where(eq(leadCaptureTable.id, validatedFields.leadId));

            if (validatedFields.userType === "agent") {
                const { success, message } = await handlePromoteAgent(validatedFields, tx);
                if (!success) {
                    return {
                        success,
                        message
                    }
                }

            }
            if (validatedFields.userType === "team-leader") {

                const { success, message } = await handlePromoteTeamLeader(validatedFields, tx);
                if (!success) {
                    return {
                        success,
                        message
                    }
                }
            }
        });

        return {
            success: true,
            message: "Lead promoted successfully",
        }

    } catch (error) {
        console.error("Error promoting lead", error);
        return {
            success: false,
            message: "Error promoting lead",
        }
    }

}

/** 
 * @description - Handles the promotion of an agent creates a better auth user, creates agent entry
 * @param validatedFields - The validated fields from the form
 * @param tx - The transaction object
 * @returns {Promise<{ success: boolean, message: string }>} - The result of the operation
 */
async function handlePromoteAgent(validatedFields: PromoteLeadSchemaType, tx: PgTransaction<PostgresJsQueryResultHKT, Record<string, never>, ExtractTablesWithRelations<Record<string, never>>>) {
    const [existingAgent] = await db
        .select()
        .from(agentsTable)
        .where(eq(agentsTable.email, validatedFields.email))
        .limit(1);

    if (existingAgent) {
        return { success: false, message: "Email already in use" }
    }

    const { user } = await auth.api.createUser({
        body: {
            email: validatedFields.email,
            password: validatedFields.password,
            name: validatedFields.name,
            role: "user",
        },
    });

    await tx.insert(agentsTable).values({
        studentId: user.id,
        name: validatedFields.name,
        email: validatedFields.email,
        phone: validatedFields.phoneNumber,
    });
    return { success: true, message: "Agent created successfully" }
}
/**
 * @description - Handles the promotion of a team leader creates a better auth user, creates team leader entry, and updates all the agnets to have the new team leader id if agents were provided
 * @param validatedFields - The validated fields from the form
 * @param tx - The transaction object
 * @returns {Promise<{ success: boolean, message: string }>} - The result of the operation
 */
async function handlePromoteTeamLeader(validatedFields: PromoteLeadSchemaType, tx: PgTransaction<PostgresJsQueryResultHKT, Record<string, never>, ExtractTablesWithRelations<Record<string, never>>>) {
    const [existingTeamLeader] = await db
        .select()
        .from(teamLeadersTable)
        .where(eq(teamLeadersTable.email, validatedFields.email))
        .limit(1);

    if (existingTeamLeader) {
        return { success: false, message: "Email already in use" }
    }
    // we will create a new team leader
    const { user } = await auth.api.createUser({
        body: {
            email: validatedFields.email,
            password: validatedFields.password,
            name: validatedFields.name,
            // @ts-ignore
            role: "team_leader",

        },
    });

    const [insertedTeamLeader] = await tx.insert(teamLeadersTable).values({
        teamLeaderId: user.id,
        name: validatedFields.name,
        email: validatedFields.email,
        phone: validatedFields.phoneNumber,
    }).returning({ id: teamLeadersTable.id });

    // if there are agents we need to assign all those agents with the new team leader id
    if (validatedFields.agents && validatedFields.agents.length > 0) {
        await tx.update(agentsTable).set({
            teamLeaderId: insertedTeamLeader.id,
        }).where(inArray(agentsTable.studentId, validatedFields.agents));
    }

    return { success: true, message: "Team leader created successfully" }
}