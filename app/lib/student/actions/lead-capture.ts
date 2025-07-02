
import { eq } from "drizzle-orm";
import { createCookie, data } from "react-router";
import db from "~/db/index.server";
import { leadCaptureTable } from "~/db/schema";
import { leadCaptureSchema } from "~/lib/zod-schemas/lead-capture";

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