import { z } from "zod";
import { domainRestrictedEmail } from "./auth";

export const waitlistSchema = z.object({
    email: domainRestrictedEmail,
});

export type WaitlistSchema = z.infer<typeof waitlistSchema>;