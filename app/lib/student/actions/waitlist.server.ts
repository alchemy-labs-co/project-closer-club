
import { eq } from "drizzle-orm";
import { createCookie, data } from "react-router";
import db from "~/db/index.server";
import { waitlistTable } from "~/db/schema";
import { waitlistSchema } from "~/lib/zod-schemas/waitlist";

export async function handleCreateWaitlist(request: Request, formData: FormData) {
    try {
        const email = formData.get("email") as string;

        //    check if the email contains the allowed domains
        const unvalidatedFields = waitlistSchema.safeParse({ email });
        if (!unvalidatedFields.success) {
            return {
                success: false,
                message: "Email must be from one of the following domains: @universecoverage.com, @spectra.com",
            }
        }
        const validatedFields = unvalidatedFields.data;
        // check if the email is already in the waitlist
        const [existingWaitlist] = await db.select().from(waitlistTable).where(eq(waitlistTable.email, validatedFields.email));
        if (existingWaitlist) {
            return {
                success: false,
                message: "Email already in waitlist",
            }
        }

        const [insertedWaitlist] = await db.insert(waitlistTable).values({
            email: validatedFields.email,
        }).returning({ id: waitlistTable.id });

        if (!insertedWaitlist.id) {
            return {
                success: false,
                message: "Error creating waitlist entry",
            }
        }
        // throw error;
        // set cookie
        const waitlistCookie = createCookie("waitlist", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 30, // 30 days   
            sameSite: "lax",
        });

        return data({
            success: true,
            message: "Waitlist created successfully",
        }, {
            headers: {
                "Set-Cookie": await waitlistCookie.serialize(insertedWaitlist.id),
            },
        });
    } catch (error) {
        console.error("Error creating waitlist entry", error);
        return {
            success: false,
            message: "Error creating waitlist entry",
        }
    }

}