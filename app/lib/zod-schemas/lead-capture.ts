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

export type leadCaptureSchemaType = z.infer<typeof leadCaptureSchema>;