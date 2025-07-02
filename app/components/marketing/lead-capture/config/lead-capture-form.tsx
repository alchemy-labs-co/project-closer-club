import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useFetcher } from "react-router";
import { Form } from "~/components/ui/form";
import type { FetcherResponse } from "~/lib/types";
import { leadCaptureSchema, type leadCaptureSchemaType } from "~/lib/zod-schemas/lead-capture";
import { useMarketingPageLoaderData } from "~/routes/_index";
import FormFooter from "./lead-capture-footer";
import { steps } from "./lead-capture-stepper.config";
import { ProgressBar } from "./progress-bar";
import RenderComponent from "./render-component";
import { FormControlsProvider } from "./use-lead-capture-form";
	
export function LeadCaptureForm() {
	const {leadCapture} = useMarketingPageLoaderData();
    const fetcher = useFetcher<FetcherResponse>({
		key: "lead-capture-form-fetcher",
	});
    const form = useForm<leadCaptureSchemaType>({
		resolver: zodResolver(leadCaptureSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			phoneNumber: "",
            stateOfResidence: "California",
            areYouOver18: undefined,
            doYouHaveAnyFeloniesOrMisdemeanors: undefined,
		},
	});
			const optimisticResult = fetcher.formData?.get("email") ?? leadCapture;

    return (
<FormControlsProvider steps={steps}>
		{optimisticResult && <p className="text-sm text-white/60 text-center relative z-40">You are on the waitlist</p>}
        {!optimisticResult && (<Form {...form}>
						<fetcher.Form
							action="/resource/lead-capture"
							method="POST"
							className="w-full relative z-40"
							onSubmit={form.handleSubmit(async (data) => {
								fetcher.submit(
									{ ...data, intent: "create-lead-capture" },
									{
										method: "POST",
										action: "/resource/lead-capture",
									}
								);
							})}
							>
							<div className="mx-auto flex max-w-3xl flex-col justify-start gap-6 md:gap-0 relative z-40">
								<ProgressBar steps={steps} />
								<RenderComponent steps={steps} />
								<FormFooter steps={steps} />
							</div>
						</fetcher.Form>
					</Form>)}
					</FormControlsProvider>
    )
}