import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router";
import type { Route } from "./+types/root";
import fontStyles from "./styles/fonts.css?url";
import "./styles/global.css";
import { Toaster } from "sonner";
import { metadata, assets } from "~/config/branding";

export function meta() {
	// For OG images, we need to use absolute URLs
	// In production, this should be set via environment variable
	const baseUrl = typeof window !== "undefined" 
		? window.location.origin 
		: process.env.PUBLIC_URL || "http://localhost:5173";
	const ogImageUrl = `${baseUrl}${assets.openGraph.default}`;
	
	return [
		{ title: metadata.siteName },
		{ name: "description", content: metadata.siteDescription },
		{ name: "theme-color", content: metadata.defaultMeta.themeColor },
		{ name: "keywords", content: metadata.defaultMeta.keywords },
		{ name: "viewport", content: "width=device-width,initial-scale=1" },
		{ charSet: "utf-8" },
		// Open Graph defaults
		{ property: "og:site_name", content: metadata.social.openGraph.siteName },
		{ property: "og:type", content: metadata.social.openGraph.type },
		{ property: "og:locale", content: metadata.social.openGraph.locale },
		{ property: "og:title", content: metadata.siteName },
		{ property: "og:description", content: metadata.siteDescription },
		{ property: "og:image", content: ogImageUrl },
		{ property: "og:image:width", content: "1200" },
		{ property: "og:image:height", content: "630" },
		{ property: "og:image:alt", content: metadata.siteName },
		// Twitter defaults
		{ name: "twitter:card", content: metadata.social.twitter.card },
		{ name: "twitter:site", content: metadata.social.twitter.site },
		{ name: "twitter:creator", content: metadata.social.twitter.creator },
		{ name: "twitter:title", content: metadata.siteName },
		{ name: "twitter:description", content: metadata.siteDescription },
		{ name: "twitter:image", content: ogImageUrl },
		{ name: "twitter:image:alt", content: metadata.siteName },
	];
}

export const links: Route.LinksFunction = () => [
	{ rel: "stylesheet", href: fontStyles },
	// Favicons
	{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
	{ rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
	{ rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
	{ rel: "icon", type: "image/png", sizes: "192x192", href: "/android-chrome-192x192.png" },
	{ rel: "icon", type: "image/png", sizes: "512x512", href: "/android-chrome-512x512.png" },
	{ rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
	// Manifest (we'll create this next)
	{ rel: "manifest", href: "/manifest.json" },
];

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<Meta />
				<Links />
			</head>
			<body className="font-satoshi min-h-dvh">
				{children}
				<Toaster position="top-center" richColors />
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details =
			error.status === 404
				? "The requested page could not be found."
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="pt-16 p-4 container mx-auto">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full p-4 overflow-x-auto">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
