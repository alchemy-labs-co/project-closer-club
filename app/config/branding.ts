/**
 * Closer Club Branding Configuration
 * 
 * This file contains all brand constants including colors, typography,
 * and metadata for consistent branding across the application.
 */

export const colors = {
	// Primary brand colors
	aqua: {
		hex: "#2D9CDB",
		rgb: "45, 156, 219",
		oklch: "0.658 0.127 234.37", // Primary brand color
	},
	graphite: {
		hex: "#111216",
		rgb: "17, 18, 22",
		oklch: "0.204 0.012 264.87", // Text/Primary Dark
	},
	slate: {
		hex: "#606671",
		rgb: "96, 102, 113",
		oklch: "0.509 0.021 255.92", // Secondary Text
	},
	porcelain: {
		hex: "#F6F6F4",
		rgb: "246, 246, 244",
		oklch: "0.973 0.002 106.82", // Canvas/Background
	},
	aquaLight: {
		hex: "#9ED8FF",
		rgb: "158, 216, 255",
		oklch: "0.865 0.079 236.31", // UI tint
	},
	brass: {
		hex: "#C9A227",
		rgb: "201, 162, 39",
		oklch: "0.735 0.127 84.91", // Premium/Seal accent
	},
} as const;

export const typography = {
	// Font families
	families: {
		// Headlines (all-caps for primary lockups)
		headline: "Sora, var(--font-display), ui-sans-serif, system-ui, sans-serif",
		// Subheadings
		subhead: "Sora, var(--font-display), ui-sans-serif, system-ui, sans-serif",
		// Body/UI text
		body: "Inter, var(--font-sans), ui-sans-serif, system-ui, sans-serif",
		// Numeric/Code (optional)
		mono: "IBM Plex Mono, ui-monospace, monospace",
		// Display font (existing)
		display: "SF Pro Display, var(--font-display), ui-sans-serif, system-ui, sans-serif",
	},
	// Font weights
	weights: {
		headline: 700, // Bold
		subhead: 600, // Semibold
		body: {
			regular: 400,
			medium: 500,
		},
		mono: 400,
	},
	// Font sizes (can be customized based on design needs)
	sizes: {
		xs: "0.75rem", // 12px
		sm: "0.875rem", // 14px
		base: "1rem", // 16px
		lg: "1.125rem", // 18px
		xl: "1.25rem", // 20px
		"2xl": "1.5rem", // 24px
		"3xl": "1.875rem", // 30px
		"4xl": "2.25rem", // 36px
		"5xl": "3rem", // 48px
		"6xl": "3.75rem", // 60px
		"7xl": "4.5rem", // 72px
	},
} as const;

export const logo = {
	// Logo usage rules
	usage: {
		// Clear space = height of the check's stem around all sides
		clearSpace: "1em", // Relative to logo size
		// Minimum sizes
		minSize: {
			print: {
				monogram: "12mm",
				lockup: "18mm",
			},
			digital: {
				monogram: "32px",
				lockup: "60px",
			},
		},
		// Color variants
		variants: {
			// 1-color variants
			lightBg: colors.aqua.hex, // Aqua on light
			darkBg: "#FFFFFF", // White on dark
			noColor: colors.graphite.hex, // Graphite where color is unavailable
		},
		// Restrictions
		restrictions: [
			"No gradients on the mark",
			"No glows on the mark",
			"No drop-shadows on the mark",
			"No outlines on the mark",
		],
	},
} as const;

export const metadata = {
	// Site metadata
	siteName: "Closer Club",
	siteDescription: "Transform Your Insurance Career with Closer Club - Comprehensive virtual training platform for insurance sales professionals.",
	siteUrl: "https://closerclub.com", // Update with actual URL
	
	// Social media metadata
	social: {
		twitter: {
			card: "summary_large_image",
			site: "@closerclub", // Update with actual handle
			creator: "@closerclub", // Update with actual handle
		},
		openGraph: {
			type: "website",
			locale: "en_US",
			siteName: "Closer Club",
		},
	},
	
	// Default meta tags
	defaultMeta: {
		charset: "utf-8",
		viewport: "width=device-width,initial-scale=1",
		themeColor: colors.aqua.hex,
		keywords: "insurance training, sales training, virtual training, insurance career, sales professional",
	},
} as const;

export const assets = {
	// Asset paths
	favicon: {
		ico: "/favicon.ico",
		png16: "/favicon-16x16.png",
		png32: "/favicon-32x32.png",
		png192: "/android-chrome-192x192.png",
		png512: "/android-chrome-512x512.png",
		appleTouchIcon: "/apple-touch-icon.png",
	},
	logos: {
		emblem: "/logos/closer-club-emblem.png",
		icon: "/logos/closer-club-icon.png",
		primary: "/logos/closer-club-logo.png",
	},
	openGraph: {
		default: "/og-image.png",
	},
} as const;

// Helper function to get CSS custom properties
export function getCSSVariables() {
	return {
		// Colors
		"--color-brand-aqua": colors.aqua.hex,
		"--color-brand-graphite": colors.graphite.hex,
		"--color-brand-slate": colors.slate.hex,
		"--color-brand-porcelain": colors.porcelain.hex,
		"--color-brand-aqua-light": colors.aquaLight.hex,
		"--color-brand-brass": colors.brass.hex,
		
		// OKLCH values for Tailwind v4
		"--color-brand-aqua-oklch": colors.aqua.oklch,
		"--color-brand-graphite-oklch": colors.graphite.oklch,
		"--color-brand-slate-oklch": colors.slate.oklch,
		"--color-brand-porcelain-oklch": colors.porcelain.oklch,
		"--color-brand-aqua-light-oklch": colors.aquaLight.oklch,
		"--color-brand-brass-oklch": colors.brass.oklch,
		
		// Typography
		"--font-headline": typography.families.headline,
		"--font-subhead": typography.families.subhead,
		"--font-body": typography.families.body,
		"--font-mono": typography.families.mono,
	};
}

// Type exports for TypeScript usage
export type BrandColor = keyof typeof colors;
export type FontFamily = keyof typeof typography.families;
export type FontSize = keyof typeof typography.sizes;