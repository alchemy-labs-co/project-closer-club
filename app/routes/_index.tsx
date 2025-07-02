import { HeroSection } from "~/components/marketing/hero";
import { CTASection } from "~/components/marketing/cta-section";
import type { Route } from "./+types/_index";
import { useRouteLoaderData } from "react-router";

export async function loader({request}: Route.LoaderArgs) {
	// retrive cookie waitlist
	const leadCapture = Boolean(request.headers.get("cookie")?.split(";").find(cookie => cookie.trim().startsWith("lead-capture="))?.split("=")[1]) || false;
	return {
		leadCapture,
	};
}

export function useMarketingPageLoaderData() {
	const data = useRouteLoaderData<typeof loader>("routes/_index");
	if(!data) {
		throw new Error("Marketing page loader data must be consumed within the marketing page context meaning the route must be a child of the marketing page route")
	}
	return data;
}
export default function MarketingPage({loaderData}: Route.ComponentProps) {

	return (
		<main className="flex flex-col gap-0">
			<HeroSection/>
			<CTASection/>
		</main>
	);
}
