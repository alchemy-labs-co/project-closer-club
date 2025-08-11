/**
 * URL utility functions for environment-aware URL generation
 */

/**
 * Get the base URL for the current environment
 * Works for both server and client-side rendering
 */
export function getBaseUrl(request?: Request): string {
	// For server-side rendering with request object
	if (request) {
		const url = new URL(request.url);
		return `${url.protocol}//${url.host}`;
	}
	
	// For client-side rendering
	if (typeof window !== "undefined") {
		return window.location.origin;
	}
	
	// Fallback to environment variable or default
	return process.env.PUBLIC_URL || process.env.VITE_PUBLIC_URL || "http://localhost:5173";
}

/**
 * Generate an absolute URL for assets (like OG images)
 * @param path - The path to the asset (e.g., "/og-image.png")
 * @param request - Optional request object for server-side rendering
 */
export function getAssetUrl(path: string, request?: Request): string {
	const baseUrl = getBaseUrl(request);
	// Ensure path starts with /
	const assetPath = path.startsWith("/") ? path : `/${path}`;
	return `${baseUrl}${assetPath}`;
}

/**
 * Generate proper meta tags with absolute URLs
 * Useful for OG images and canonical URLs
 */
export function getMetaUrl(path: string, request?: Request): string {
	const baseUrl = getBaseUrl(request);
	// Remove leading slash if present to avoid double slashes
	const cleanPath = path.startsWith("/") ? path.slice(1) : path;
	return cleanPath ? `${baseUrl}/${cleanPath}` : baseUrl;
}