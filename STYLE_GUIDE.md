# Closer Club Style Guide

This document outlines the brand guidelines and design system for the Closer Club application.

## Brand Colors

Our color palette is designed to convey professionalism, trust, and innovation in the insurance training industry.

### Primary Colors

- **Aqua (Primary)**: `#2D9CDB` - Used for primary actions, links, and brand emphasis
- **Graphite (Text/Primary Dark)**: `#111216` - Primary text color and dark backgrounds
- **Slate (Secondary Text)**: `#606671` - Secondary text and muted elements
- **Porcelain (Canvas/Background)**: `#F6F6F4` - Main background color
- **Aqua Light (UI tint)**: `#9ED8FF` - Hover states and light accents
- **Brass (Premium/Seal accent)**: `#C9A227` - Premium features and special accents

### Usage Guidelines

- Use Aqua for primary CTAs, active states, and key interactive elements
- Use Graphite for body text and headings on light backgrounds
- Use Slate for secondary information, labels, and helper text
- Use Porcelain as the default background color
- Use Aqua Light for hover states and subtle highlights
- Use Brass sparingly for premium features or special callouts

### CSS Classes

The color system is available through CSS custom properties and Tailwind classes:

```css
/* Brand color classes */
.text-brand-aqua { color: var(--color-brand-aqua); }
.bg-brand-aqua { background-color: var(--color-brand-aqua); }
.border-brand-aqua { border-color: var(--color-brand-aqua); }

/* Similarly for other brand colors:
   brand-graphite, brand-slate, brand-porcelain, 
   brand-aqua-light, brand-brass */
```

## Typography

Our typography system emphasizes clarity and hierarchy.

### Font Families

1. **Headlines**: Sora Bold (700)
   - Used for all headings (h1-h6)
   - All-caps for primary lockups

2. **Subheadings**: Sora Semibold (600)
   - Used for section headers and emphasis

3. **Body/UI**: Inter Regular (400) / Medium (500)
   - Used for body text and UI elements

4. **Numeric/Code** (optional): IBM Plex Mono
   - Used for code snippets and numeric displays

### Implementation

The fonts are automatically loaded via Google Fonts. Use these CSS variables or Tailwind classes:

```css
/* Font family classes */
.font-headline { font-family: var(--font-headline); }
.font-body { font-family: var(--font-body); }
.font-mono { font-family: var(--font-mono); }
```

### Type Scale

- `text-xs`: 0.75rem (12px)
- `text-sm`: 0.875rem (14px)
- `text-base`: 1rem (16px)
- `text-lg`: 1.125rem (18px)
- `text-xl`: 1.25rem (20px)
- `text-2xl`: 1.5rem (24px)
- `text-3xl`: 1.875rem (30px)
- `text-4xl`: 2.25rem (36px)
- `text-5xl`: 3rem (48px)
- `text-6xl`: 3.75rem (60px)
- `text-7xl`: 4.5rem (72px)

## Logo Usage

### Clear Space
- Maintain clear space equal to the height of the check's stem around all sides of the logo

### Minimum Sizes
- **Digital**:
  - Monogram: 32px minimum
  - Full lockup: 60px minimum
- **Print**:
  - Monogram: 12mm minimum
  - Full lockup: 18mm minimum

### Color Variants
- **On light backgrounds**: Use Aqua (#2D9CDB)
- **On dark backgrounds**: Use White (#FFFFFF)
- **When color is unavailable**: Use Graphite (#111216)

### Restrictions
- ❌ No gradients on the logo mark
- ❌ No glows or effects
- ❌ No drop shadows
- ❌ No outlines

## Component Patterns

### Buttons

Primary buttons should use the Aqua gradient:
```jsx
className="bg-gradient-to-br from-brand-aqua to-brand-aqua/80 text-white hover:from-brand-aqua/90 hover:to-brand-aqua/70"
```

### Cards

Cards should use subtle borders and shadows:
```jsx
className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
```

### Form Elements

Form inputs should have a focus state using the brand colors:
```jsx
className="focus:ring-2 focus:ring-brand-aqua focus:border-brand-aqua"
```

## Dark Mode

The application supports dark mode with adjusted color values:
- Background switches to Graphite
- Text switches to light colors
- Brand colors remain consistent but may have adjusted opacity

## Accessibility

- Ensure all text has sufficient contrast (WCAG AA compliance)
- Aqua on white: ✅ Passes AA
- Graphite on Porcelain: ✅ Passes AA
- Always test color combinations for accessibility

## Implementation Files

- **Branding Config**: `/app/config/branding.ts` - Central configuration
- **Global Styles**: `/app/styles/global.css` - CSS custom properties
- **Font Imports**: `/app/styles/fonts.css` - Font definitions

## Quick Reference

```javascript
import { colors, typography, metadata, assets } from '~/config/branding';

// Access brand colors
colors.aqua.hex // "#2D9CDB"

// Access typography
typography.families.headline // "Sora, ..."

// Access metadata
metadata.siteName // "Closer Club"

// Access asset paths
assets.logos.primary // "/logos/closer-club-logo.png"
```

---

For questions or updates to the brand guidelines, please contact the design team.