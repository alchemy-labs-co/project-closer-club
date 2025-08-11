import { HeroSection } from "~/components/marketing/hero";
import { FeaturesSection } from "~/components/marketing/features";
import { AboutSection } from "~/components/marketing/about";
import { CTASection } from "~/components/marketing/cta-section";
import { Footer } from "~/components/marketing/footer";
import type { Route } from "./+types/_index";
import { useRouteLoaderData } from "react-router";
import { metadata, assets } from "~/config/branding";

export function meta() {
	const pageTitle = `${metadata.siteName} - Transform Your Insurance Career`;
	const pageDescription = metadata.siteDescription;
	const pageUrl = metadata.siteUrl;
	
	return [
		{ title: pageTitle },
		{ name: "description", content: pageDescription },
		// Open Graph
		{ property: "og:title", content: pageTitle },
		{ property: "og:description", content: pageDescription },
		{ property: "og:url", content: pageUrl },
		{ property: "og:image", content: `${metadata.siteUrl}${assets.openGraph.default}` },
		{ property: "og:image:width", content: "1536" },
		{ property: "og:image:height", content: "1024" },
		// Twitter
		{ name: "twitter:title", content: pageTitle },
		{ name: "twitter:description", content: pageDescription },
		{ name: "twitter:image", content: `${metadata.siteUrl}${assets.openGraph.default}` },
		// Canonical
		{
			tagName: "link",
			rel: "canonical",
			href: pageUrl,
		},
	];
}

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
			<FeaturesSection/>
			<AboutSection/>
			<CTASection/>
			<Footer/>
		</main>
	);
}
