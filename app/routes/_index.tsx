import { HeroSection } from "~/components/marketing/hero";
import { FeaturesSection } from "~/components/marketing/features";
import { AboutSection } from "~/components/marketing/about";
import { CTASection } from "~/components/marketing/cta-section";
import { Footer } from "~/components/marketing/footer";
import type { Route } from "./+types/_index";
import { useRouteLoaderData } from "react-router";
import { metadata, assets } from "~/config/branding";

export function meta({ matches }: Route.MetaArgs) {
	const pageTitle = `${metadata.siteName} - Transform Your Insurance Career`;
	const pageDescription =
		"Master insurance sales with Closer Club's comprehensive virtual training platform. Expert-led courses, real-world scenarios, and proven strategies to accelerate your career.";

	// For production, this should come from environment variable
	const baseUrl =
		typeof window !== "undefined"
			? window.location.origin
			: process.env.PUBLIC_URL || "http://localhost:5173";
	const pageUrl = baseUrl;
	const ogImageUrl = `${baseUrl}${assets.openGraph.default}`;

	// Get parent meta tags
	const parentMeta = matches.flatMap((match) => match?.meta ?? []);

	// Filter out meta tags we want to override
	const filteredParentMeta = parentMeta.filter((meta: any) => {
		if ("title" in meta) return false;
		if ("name" in meta && meta.name === "description") return false;
		if ("property" in meta && meta.property?.startsWith("og:title"))
			return false;
		if ("property" in meta && meta.property?.startsWith("og:description"))
			return false;
		if ("property" in meta && meta.property?.startsWith("og:url")) return false;
		if ("name" in meta && meta.name?.startsWith("twitter:title")) return false;
		if ("name" in meta && meta.name?.startsWith("twitter:description"))
			return false;
		return true;
	});

	return [
		...filteredParentMeta,
		{ title: pageTitle },
		{ name: "description", content: pageDescription },
		// Open Graph overrides
		{ property: "og:title", content: pageTitle },
		{ property: "og:description", content: pageDescription },
		{ property: "og:url", content: pageUrl },
		// Twitter overrides
		{ name: "twitter:title", content: pageTitle },
		{ name: "twitter:description", content: pageDescription },
		// Canonical
		{
			tagName: "link",
			rel: "canonical",
			href: pageUrl,
		},
	];
}

export async function loader({ request }: Route.LoaderArgs) {
	// retrive cookie waitlist
	const leadCapture =
		Boolean(
			request.headers
				.get("cookie")
				?.split(";")
				.find((cookie) => cookie.trim().startsWith("lead-capture="))
				?.split("=")[1],
		) || false;
	return {
		leadCapture,
	};
}

export function useMarketingPageLoaderData() {
	const data = useRouteLoaderData<typeof loader>("routes/_index");
	if (!data) {
		throw new Error(
			"Marketing page loader data must be consumed within the marketing page context meaning the route must be a child of the marketing page route",
		);
	}
	return data;
}
export default function MarketingPage({ loaderData }: Route.ComponentProps) {
	return (
		<main className="flex flex-col gap-0">
			<HeroSection />
			<FeaturesSection />
			<AboutSection />
			<CTASection />
			<Footer />
		</main>
	);
}
