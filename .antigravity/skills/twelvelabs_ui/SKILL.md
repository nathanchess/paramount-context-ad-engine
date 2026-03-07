---
name: TwelveLabs Strand UI
description: Enforces the TwelveLabs Strand design system when generating or modifying UI components in this repository. Covers colors, typography, spacing, buttons, icons, and dark mode for Next.js, React, and Vue.
---

# TwelveLabs Strand UI — Antigravity Agent Skill

## When to Activate

This skill applies whenever you are:
- Creating or modifying any `.tsx`, `.jsx`, `.vue`, `.css`, or `.html` file in this repository
- Generating UI components, pages, or layouts
- Suggesting color values, font choices, spacing, or button styles

## Required Reading

Before generating any UI code, you **MUST** read the Single Source of Truth:

```
docs/STRANDS_AGENT_RULES.md
```

Use the `view_file` tool to read this file at:
`<workspace>/docs/STRANDS_AGENT_RULES.md`

This file contains the complete Strand design system specification.

## Mandatory Rules

You must enforce these rules on every UI generation or modification:

### Colors
- **NEVER hardcode hex color values.** Use Strand Tailwind classes (`bg-background`, `text-text-primary`, `bg-accent`) or CSS variables (`var(--strand-ui-background)`).
- **Use semantic color names** for UI surfaces and text — not raw gray or brand tokens.
- Brand Green (`#00FF00`) is **only for logos/marketing**. For UI accent, use `#00DC82` (`bg-accent`).

### Typography
- **Primary body font:** Noto Sans (via `font-system`). **NOT Inter.**
- **Brand font:** Milling Duplex 1mm (via `font-brand`).
- **Code font:** IBM Plex Mono (via `font-mono`).
- Use the defined font size scale: `jumbo` (64px) → `xs` (10px).

### Spacing
- **4px grid.** All spacing must be a multiple of 4px.
- Use Strand spacing tokens: `p-1` (4px) through `p-16` (64px).
- Content max width: 1200px. Chat max: 800px. Header height: 56px.

### Buttons
- Use **only** the defined button variants from `strand/tokens/buttons.json`.
- 6 sizes: mini, small, regular, medium, large, xlarge.
- 11 variants: black, white, gray, ghosted-black, ghosted-white, blur, black-outline, white-outline, white-outline-blur, disabled-black, disabled-white, disabled-outline.
- **Hover radius bump:** On hover, `border-radius` increases by one token step. Apply `transition: background-color 200ms ease, border-radius 200ms ease`.

### Icons
- Use icons from `strand/icons/` (81 SVG files).
- All icons are **16×16**, stroke-based with `currentColor`.
- Icon manifest: `strand/tokens/icons.json`.

### Dark Mode
- Use `class="dark"` on `<html>` — **NEVER** `prefers-color-scheme`.
- All semantic UI colors auto-swap via CSS custom properties.

### Design Philosophy
- **No emoji in UI.** Never use emoji in buttons, labels, headings, or body text. Use SVG icons from `strand/icons/` instead.
- **White-majority aesthetic.** Default background is pure white (`#FFFFFF`). Use `#F4F3F3` sparingly for card accents. Think TwelveLabs.io, Linear, Vercel — not Bootstrap or Material UI.
- **No login screens.** Sample apps use API keys via env vars or inline input, not auth flows.
- **Professional, purposeful design.** Every component must demonstrate real TwelveLabs API impact (search results, generated text, video analysis, embeddings). No decorative filler.
- **Minimalistic layout.** Generous whitespace, thin borders (`#E8E7E5`), charcoal pill buttons with arrow icons.
- **Content-first.** Lead with the user's content (video, search results, generated output) — not settings panels or configuration forms.
- **Typography-driven hierarchy.** Large bold headings with tight tracking. Body text is muted gray (`#6B6966`), not black.

### Border Radius
- `sm` (4px), `md` (8px), `lg` (12px), `xl` (16px), `2xl` (24px), `full` (pill).
- Hero elements: use 30% of shortest side.

## Framework Integration

| Framework | Integration Method |
|-----------|--------------------|
| **Next.js** | Tokens pre-wired in `globals.css` via `@theme inline` (Tailwind v4) |
| **React (Vite)** | Use `strand/tailwind-preset.js` as Tailwind v3 preset |
| **Vue** | Same Tailwind preset or import `strand/css/variables.css` for raw CSS vars |

## Token File Locations

- `strand/tokens/colors.json` — complete color palette
- `strand/tokens/typography.json` — font families and size scale
- `strand/tokens/spacing.json` — spacing, sizing, layout
- `strand/tokens/buttons.json` — button system
- `strand/tokens/radii.json` — border radius
- `strand/tokens/shadows.json` — box shadows
- `strand/tokens/icons.json` — icon manifest
- `strand/css/variables.css` — all tokens as CSS custom properties
- `strand/css/fonts.css` — font imports
- `strand/assets/` — logo files (logo-full.svg, logo-mark.svg, logo-wordmark.svg)

## Validation Checklist

Before returning any UI code, verify:

- [ ] No hardcoded hex colors
- [ ] Uses Strand font stack (Noto Sans, not Inter)
- [ ] All spacing values are multiples of 4px
- [ ] Buttons use defined variants with hover radius-bump
- [ ] Dark mode uses class strategy
- [ ] Icons are from strand/icons/ at 16×16 with currentColor
- [ ] Content respects max-width constraints (1200px / 800px)
- [ ] No emoji in any user-facing text
- [ ] White-majority background (pure white #FFFFFF default)
- [ ] No login/auth flows — API key via env var or inline input
- [ ] Every component serves a real purpose (no decorative filler)
- [ ] Minimalistic layout with generous whitespace
