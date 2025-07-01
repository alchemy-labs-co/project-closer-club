import { HeroSection } from "~/components/marketing/hero";
import { CTASection } from "~/components/marketing/cta-section";
import type { Route } from "./+types/_index";
import { useRouteLoaderData } from "react-router";

export async function loader({request}: Route.LoaderArgs) {
	// retrive cookie waitlist
	const waitlist = Boolean(request.headers.get("cookie")?.split(";").find(cookie => cookie.trim().startsWith("waitlist="))?.split("=")[1]) || false;
	return {
		waitlist,
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
		<>
			<HeroSection/>
			<CTASection/>
		</>
	);
}
