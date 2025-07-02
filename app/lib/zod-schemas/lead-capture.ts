import { z } from "zod";

export const leadCaptureSchema = z.object({
    firstName: z.string().min(1, "First Name is required"),
    lastName: z.string().min(1, "Last Name is required"),
    phoneNumber: z.string().min(1, "Phone Number is required"),
    email: z.string().email().min(1, "Email is required"),
    stateOfResidence: z.string().min(1, "State of Residence is required"),
    areYouOver18: z.boolean().refine((val) => val, "You must be over 18 to participate"),
    doYouHaveAnyFeloniesOrMisdemeanors: z.boolean().refine((val) => val, "You must have no felonies or misdemeanors to participate"),
});


export const promoteLeadSchema = z.object({
    leadId: z.string().min(1, "Lead ID is required"),
    userType: z.string().min(1, "User Type is required"),
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phoneNumber: z.string().optional(),
    agents: z.array(z.string()).optional(),
    courses: z.array(z.string()).optional()
});

export const rejectLeadSchema = z.object({
    leadId: z.string().min(1, "Lead ID is required"),
    reason: z.string().optional()
});

export type leadCaptureSchemaType = z.infer<typeof leadCaptureSchema>;
export type PromoteLeadSchemaType = z.infer<typeof promoteLeadSchema>;
export type RejectLeadSchemaType = z.infer<typeof rejectLeadSchema>;