import type { Step } from "~/lib/types";
import { WhatIsYourName } from "../steps/name";
import { ContactInformation } from "../steps/contact-info";
import { StateOfResidence } from "../steps/state";
import { Verifications } from "../steps/verifications";

export const steps: Step[] = [
	{
		id: "1",
		title: "Tell us about yourself",
		component: <WhatIsYourName />,
		inputs: ["firstName", "lastName"],
	},
	{
		id: "2",
		title: "Contact Information",
		component: <ContactInformation />,
		inputs: ["phoneNumber", "email"],
	},
	{
		id: "3",
		title: "Location",
		component: <StateOfResidence />,
		inputs: ["stateOfResidence"],
	},
	{
		id: "4",
		title: "Verification Requirements",
		component: <Verifications />,
		inputs: ["areYouOver18", "doYouHaveAnyFeloniesOrMisdemeanors"],
	},
] satisfies Step[];
