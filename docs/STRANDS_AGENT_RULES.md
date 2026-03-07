# Strand Design System — Agent Rules (Single Source of Truth)

> **This file is the SSOT for all AI agents** (Cursor, Claude Code, Antigravity) working in this repository.
> Every agent must follow these rules when generating or modifying UI code.

---

## 1. Project Context

This is the **TwelveLabs DevEx Agent Boilerplate** — a repository that the TwelveLabs GTM Engineering team uses to rapidly build sample apps. All UI must conform to the internal **Strand** design system (`strand/` folder).

### Supported Frameworks

| Framework | Setup | Tailwind Integration |
|-----------|-------|---------------------|
| **Next.js** (default) | App Router, TypeScript, `src/` dir | Tailwind v4 via `@tailwindcss/postcss` — tokens in `globals.css` `@theme inline` block |
| **React (Vite)** | Use `strand/tailwind-preset.js` in `tailwind.config.js` `presets: [strandPreset]` | Tailwind v3 preset or import `strand/css/variables.css` directly |
| **Vue** | Import `strand/css/variables.css` + `strand/css/fonts.css` in your entry CSS | Use Tailwind v3 preset or raw CSS custom properties `var(--strand-*)` |

---

## 2. Color System

### 2.1 Brand Colors (Static — no dark mode swap)

| Token | Hex | Tailwind Class | CSS Variable |
|-------|-----|----------------|-------------|
| Brand Green | `#00FF00` | `text-brand-green` / `bg-brand-green` | `--strand-brand-green` |
| Brand Charcoal | `#1D1C1B` | `text-brand-charcoal` / `bg-brand-charcoal` | `--strand-brand-charcoal` |
| Brand White | `#F4F3F3` | `text-brand-white` / `bg-brand-white` | `--strand-brand-white` |
| Brand Grey | `#D3D1CF` | `text-brand-grey` / `bg-brand-grey` | `--strand-brand-grey` |

> ⚠ **`#00FF00` is for logos/marketing only.** For UI accent, use `#00DC82` (`accent`).

### 2.2 Masterbrand Colors (Static)

| Name | Hex | Usage |
|------|-----|-------|
| MB Green | `#60E21B` | Primary highlight, success |
| MB Orange | `#FABA17` | Warnings, Generate product |
| MB Peach | `#FFB592` | Warm accent |
| MB Pink | `#FFB0CD` | Gradient endpoint |
| **Gradient** | `linear-gradient(90deg, #60E21B, #FABA17, #FFB0CD)` | **Sparingly** — see below |

Each has `-dark` and `-light` variants (see `strand/tokens/colors.json`).

#### Masterbrand Gradient — Usage Rules

The gradient `linear-gradient(90deg, #60E21B, #FABA17, #FFB0CD)` is available as:

| CSS Class | CSS Variable | Effect |
|-----------|-------------|--------|
| `bg-gradient-brand` | `var(--strand-gradient-brand)` | Gradient background |
| `text-gradient-brand` | — | Gradient text fill (via background-clip) |

**Usage: sparingly only.** The gradient should be used for:
- Small accent bars or dividers (e.g., a 3px vertical bar next to a heading)
- Rare button backgrounds on primary hero CTAs (not every button)
- Occasional gradient text for emphasis headings (not body text)

**Do NOT use the gradient for:**
- Full section backgrounds
- Every button or card
- Borders or large areas of the page

The brand gradient is a signature element — overusing it dilutes its impact. White and charcoal should dominate the page.

### 2.3 Gray Ramp

| Step | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| 50 | `#F4F3F3` | `bg-gray-50` | Page backgrounds |
| 100 | `#ECECEC` | `bg-gray-100` | Card backgrounds |
| 200 | `#E2E2E2` | `bg-gray-200` | Subtle borders, hover |
| 300 | `#D3D1CF` | `bg-gray-300` | Dividers, default borders |
| 400 | `#BDBCBB` | `bg-gray-400` | Placeholder borders |
| 500 | `#8F8984` | `text-gray-500` | Muted text, icons |
| 600 | `#46423F` | `text-gray-600` | Secondary text, labels |
| 700 | `#1D1C1B` | `text-gray-700` | Primary text |

### 2.4 Semantic UI Colors (Light/Dark Mode)

These automatically swap when `class="dark"` is on `<html>`:

| Name | Light | Dark | Tailwind |
|------|-------|------|----------|
| Background | `#F4F3F3` | `#1D1C1B` | `bg-background` |
| Surface | `#FFFFFF` | `#2A2928` | `bg-surface` |
| Card | `#ECECEC` | `#333231` | `bg-card` |
| Text Primary | `#1D1C1B` | `#F4F3F3` | `text-text-primary` |
| Text Secondary | `#6B6966` | `#9B9895` | `text-text-secondary` |
| Text Tertiary | `#9B9895` | `#6B6966` | `text-text-tertiary` |
| Text Inverse | `#FFFFFF` | `#1D1C1B` | `text-text-inverse` |
| Border | `#D3D1CF` | `#45423F` | `border-border-default` |
| Border Light | `#E8E7E5` | `#333231` | `border-border-light` |
| Accent | `#00DC82` | `#00DC82` | `bg-accent` / `text-accent` |
| Accent Hover | `#00B86E` | `#00B86E` | `hover:bg-accent-hover` |

### 2.5 System Colors (Static)

| Name | Dark | Default | Light |
|------|------|---------|-------|
| Error | `#9D422B` | `#E22622` | `#FFCCC0` |
| Warning | `#7D5D0C` | `#FABA17` | `#FDE3A2` |
| Success | `#30710E` | `#60E21B` | `#BFF3A4` |
| Info | `#366B7F` | `#6CD5FD` | `#C4EEFE` |

### 2.6 Product Line Colors

| Product | Dark | Default | Light | Usage |
|---------|------|---------|-------|-------|
| Search | `#7B5880` | `#F6AFFF` | `#FBDFFF` | Purple — Search API features |
| Generate | `#7D5D0C` | `#FABA17` | `#FDE3A2` | Orange — Generate API features |
| Embed | `#366B7F` | `#6CD5FD` | `#C4EEFE` | Blue — Embed API features |

---

## 3. Typography

### 3.1 Font Families

| Stack | Fonts | Tailwind | Usage |
|-------|-------|----------|-------|
| Brand | Milling Duplex 1mm → Noto Sans → Helvetica → Arial | `font-brand` | Headings + body (playground, marketing) |
| Brand Bold | Milling Triplex 1mm → Milling Duplex 1mm → Noto Sans | `font-brand-bold` | Heavy headlines |
| System | Noto Sans → Helvetica → Arial | `font-system` | UI body text (fallback when Milling unavailable) |
| Geist | Geist → Inter → system-ui | `font-geist` | Technical/product UI text |
| Mono | IBM Plex Mono | `font-mono` | Code snippets |

> **Important:** TwelveLabs uses **Noto Sans** as the primary fallback, **not** Inter.

### 3.2 Font Size Scale

| Scale | Size | Line Height | Weight | Letter Spacing | Usage |
|-------|------|-------------|--------|---------------|-------|
| `jumbo` | 64px | 1.1 | 700 | -3px | Hero headlines |
| `h1` | 48px | 1.2 | 700 | -2px | Page titles |
| `h2` | 40px | 1.2 | 600 | -2px | Section headers |
| `h3` | 32px | 1.3 | 600 | -1px | Sub-section headers |
| `h4` | 24px | 1.33 | 600 | -1px | Card titles |
| `h5` | 20px | 1.4 | 500 | 0 | Small headers |
| `h6` | 18px | 1.5 | 500 | 0 | Label headers |
| `lg` | 16px | 1.5 | 400 | 0 | Large body (Body1) |
| `base` | 14px | 1.43 | 400 | 0 | Default body (Body2) |
| `sm` | 12px | 1.33 | 400 | 0 | Captions (Body3) |
| `xs` | 10px | 1.4 | 500 | 0 | Micro text, badges |

---

## 4. Spacing & Layout

### 4.1 Spacing (4px Grid)

| Token | Value | Tailwind |
|-------|-------|----------|
| 1 | 4px | `p-1` / `m-1` / `gap-1` |
| 2 | 8px | `p-2` / `m-2` / `gap-2` |
| 3 | 12px | `p-3` / `m-3` / `gap-3` |
| 4 | 16px | `p-4` / `m-4` / `gap-4` |
| 5 | 20px | `p-5` / `m-5` / `gap-5` |
| 6 | 24px | `p-6` / `m-6` / `gap-6` |
| 8 | 32px | `p-8` / `m-8` / `gap-8` |
| 10 | 40px | `p-10` |
| 12 | 48px | `p-12` |
| 16 | 64px | `p-16` |

### 4.2 Sizing

| Element | Value |
|---------|-------|
| Header height | 56px |
| Sidebar width | 240px |
| Chat max width | 800px |
| Content max width | 1200px |
| Button/Input min height | 44px |

### 4.3 Layout Grid

- **Margins:** 4% of shortest side
- **Gutters:** 8% (2× margins)
- **Columns:** 12-column grid
- **Grid unit:** 4px

---

## 5. Border Radius

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `sm` | 4px | `rounded-sm` | Chips, badges |
| `md` | 8px | `rounded-md` | Buttons, inputs |
| `lg` | 12px | `rounded-lg` | Cards |
| `xl` | 16px | `rounded-xl` | Modals |
| `1.25` | 20px | `rounded-[20px]` | Feature panels |
| `2xl` | 24px | `rounded-2xl` | Feature cards |
| `full` | 9999px | `rounded-full` | Pill shapes |

**Hero radius rule:** For brand-hero elements, use 30% of shortest side.

---

## 6. Shadows

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `sm` | `0 1px 2px rgba(0,0,0,0.05)` | `shadow-sm` | Subtle elevation |
| `md` | `0 4px 6px rgba(0,0,0,0.07)` | `shadow-md` | Card elevation |
| `lg` | `0 10px 15px rgba(0,0,0,0.1)` | `shadow-lg` | Modal/dropdown elevation |

---

## 7. Button System

**Font:** Milling Duplex 1mm (`font-brand`). Full spec: `strand/tokens/buttons.json`

### 7.1 Sizes

| Size | Height | Radius | PaddingX | PaddingY | Font Size |
|------|--------|--------|----------|----------|-----------|
| mini | 24px | 7px | 4px | 4px | 10px |
| small | 28px | 8px | 8px | 6px | 12px |
| regular | 32px | 9.6px | 12px | 6px | 14px |
| medium | 40px | 12px | 18px | 8px | 16px |
| large | 48px | 16px | 18px | 18px | 20px |
| xlarge | 60px | 20px | 24px | 22px | 24px |

### 7.2 Variants

| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| `black` | `#1D1C1B` | `#F4F3F3` | none |
| `white` | `#FFFFFF` | `#1D1C1B` | none |
| `gray` | `#E2E2E2` | `#1D1C1B` | none |
| `ghosted-black` | transparent | `#1D1C1B` | none |
| `ghosted-white` | transparent | `#F4F3F3` | none |
| `blur` | `rgba(29,28,27,0.01)` | `#F4F3F3` | none (+ `backdrop-blur(20px)`) |
| `black-outline` | transparent | `#1D1C1B` | `#1D1C1B` |
| `white-outline` | transparent | `#F4F3F3` | `#F4F3F3` |
| `white-outline-blur` | `rgba(244,243,243,0.01)` | `#F4F3F3` | `#F4F3F3` (+ `backdrop-blur(10px)`) |
| `disabled-black` | `#8F8984` | `#F4F3F3` | none |
| `disabled-white` | `#ECECEC` | `#8F8984` | none |
| `disabled-outline` | transparent | `#8F8984` | `#8F8984` |

### 7.3 Hover Behavior

- **Radius bump:** On hover, border-radius increases by one token level (e.g., 20→24, 16→20, 12→16).
- **Transition:** `background-color 200ms ease, border-radius 200ms ease`

---

## 8. Icons

All icons are **16×16 SVG**, stroke-based (`currentColor`). Located in `strand/icons/`.

- **Functional** (66 icons): UI primitives — arrows, chevrons, media controls, actions
- **Playground** (68 icons): Product-specific — Default/Selected state variants

Full manifest: `strand/tokens/icons.json`

### Usage Pattern
```tsx
{/* Import SVG directly */}
import SearchIcon from '@/../../strand/icons/search.svg';

{/* Or use inline with currentColor */}
<svg className="w-4 h-4 text-current shrink-0" /* ... */ />
```

---

## 9. Logo Assets

Located in `strand/assets/`:

| File | Usage |
|------|-------|
| `logo-full.svg` | Full logo (mark + wordmark) |
| `logo-mark.svg` | Icon-only mark |
| `logo-wordmark.svg` | Text-only wordmark |

---

## 10. Dark Mode

Add `class="dark"` to `<html>` to activate. All semantic UI colors swap automatically via CSS custom properties.

```tsx
// Next.js toggle example
<html lang="en" className={isDark ? 'dark' : ''}>
```

---

## 11. Design Philosophy

All sample apps built with this boilerplate must follow the TwelveLabs visual identity:

### 11.1 Visual Aesthetic

- **White-majority layout.** Primary background is pure white (`#FFFFFF`). Use `#F4F3F3` (gray-50) sparingly for subtle section differentiation or card backgrounds. The overall feel must be clean, spacious, and premium.
- **Minimalistic.** Generous whitespace. Avoid clutter. Every element must earn its place on the page. If a section or component does not serve a clear purpose, remove it.
- **High-tech startup vibes.** Think TwelveLabs.io, Linear, Vercel — not Bootstrap or Material UI. Thin borders (`#E8E7E5`), subtle shadows, restrained color usage.
- **Typography-driven hierarchy.** Use large bold headings with tight tracking (-2px to -3px letter-spacing on hero text). Body text is muted gray (`#6B6966`), not black.
- **Charcoal pill buttons** with arrow icons (`↗`) for primary CTAs, matching the TwelveLabs.io pattern. Pill radius (`rounded-full`) for primary and outline buttons.
- **Border-separated sections.** Use `border-t border-[#E8E7E5]` to divide page sections rather than background color changes.

### 11.2 UI/UX Principles

- **No login required.** All sample apps must be usable without authentication flows. The user provides their API key inline or via environment variables.
- **No emoji in UI.** Never use emoji in buttons, labels, headings, or body text. Use SVG icons from `strand/icons/` instead.
- **Professional design.** Treat every sample app as a production product page, not a hackathon demo. It should look like a real UI/UX designer built it.
- **Meaningful components only.** Do not add decorative components that serve no purpose. Every card, section, and interactive element must showcase real TwelveLabs API impact (search results, generated text, video analysis, embeddings).
- **Content-first layout.** Lead with the user's content (video, search results, generated output) — not settings panels or configuration forms.
- **Responsive but desktop-first.** Optimize for 1200px+ viewports. Gracefully collapse for mobile.
- **Non-draggable images.** All `<img>` elements must have `draggable="false"`. The global CSS already sets `-webkit-user-drag: none` and `user-select: none`.
- **Minimalistic hover effects.** Use `hover-lift` (translateY -2px + subtle shadow) on interactive cards and code blocks. Use border color transitions on framework cards. Keep all hover animations under 200ms.
- **Brand gradient: sparingly.** The masterbrand gradient (`bg-gradient-brand`) should only be used for small accent bars, rare hero CTA backgrounds, or occasional gradient text. Never for full section backgrounds.

### 11.3 Reference Sites

Study these for correct aesthetic:
- [twelvelabs.io](https://www.twelvelabs.io/) — white backgrounds, charcoal buttons with arrows, generous spacing, bold sans-serif type
- [playground.twelvelabs.io](https://playground.twelvelabs.io/) — product UI with sidebar navigation, card-based layout

---

## 12. Mandatory Rules for AI Agents

1. **NEVER hardcode hex color values.** Always use Strand Tailwind classes or CSS variables.
2. **Use semantic color names** (`bg-background`, `text-text-primary`, `bg-accent`) — not raw gray/brand tokens — for UI surfaces and text.
3. **Import fonts** via `strand/css/fonts.css` or the `globals.css` `@import` declarations. Do not add your own `@import url(...)` for system fonts.
4. **Respect the 4px grid.** All spacing must be a multiple of 4px. Use Strand spacing tokens.
5. **Use Strand button variants.** Do not invent new button styles. Use the 6 sizes × 11 variants defined in `strand/tokens/buttons.json`.
6. **Implement hover radius bump** on buttons: on hover, increase `border-radius` by one token step.
7. **Never use Inter as primary font.** The TwelveLabs system uses Noto Sans as the fallback body font, not Inter.
8. **Icons must be 16×16 SVG** from `strand/icons/` or the icon manifest. Use `currentColor` for stroke.
9. **Dark mode must use `class="dark"`** strategy, not `prefers-color-scheme`.
10. **Content max width is 1200px.** Chat containers max at 800px. Header height is 56px.
11. **No emoji in UI.** Do not use emoji characters in any user-facing text, buttons, or labels.
12. **White-majority aesthetic.** Default page background is `#FFFFFF`. Reserve off-white/gray for card backgrounds and section accents only.
13. **No login screens.** Sample apps are API-key-driven, not auth-gated. Users provide keys via env vars or inline input.
14. **Professional, purposeful design.** Every component must demonstrate real TwelveLabs API functionality.

---

## 12. Framework-Specific Setup

### Next.js (This Boilerplate)

Already configured. Tokens are in `src/app/globals.css` via `@theme inline`.

### React (Vite/CRA)

```js
// tailwind.config.js
const strandPreset = require('./strand/tailwind-preset.js');
module.exports = {
  presets: [strandPreset],
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
};
```

```css
/* src/index.css */
@import '../strand/css/fonts.css';
@import '../strand/css/variables.css';
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Vue

```js
// tailwind.config.js (same as React)
const strandPreset = require('./strand/tailwind-preset.js');
module.exports = {
  presets: [strandPreset],
  content: ['./src/**/*.{vue,js,ts,jsx,tsx}'],
};
```

```css
/* src/assets/main.css */
@import '../../strand/css/fonts.css';
@import '../../strand/css/variables.css';
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Or use raw CSS variables without Tailwind:
```vue
<template>
  <div :style="{ backgroundColor: 'var(--strand-ui-background)', color: 'var(--strand-ui-text-primary)' }">
    <!-- Your component -->
  </div>
</template>

<style>
@import '../../strand/css/variables.css';
@import '../../strand/css/fonts.css';
</style>
```

---

## 13. Token File Reference

| File | Contents |
|------|----------|
| `strand/tokens/colors.json` | All color values with descriptions |
| `strand/tokens/typography.json` | Font families and size scale |
| `strand/tokens/spacing.json` | Spacing, sizing, and layout tokens |
| `strand/tokens/radii.json` | Border radius tokens |
| `strand/tokens/shadows.json` | Box shadow tokens |
| `strand/tokens/buttons.json` | Button sizes, variants, hover behavior |
| `strand/tokens/icons.json` | Icon manifest (functional + playground) |
| `strand/css/variables.css` | All tokens as CSS custom properties |
| `strand/css/fonts.css` | Font-face imports (CDN + self-hosted guide) |
| `strand/tailwind-preset.js` | Tailwind v3 preset (for React/Vue) |
| `strand/python/brand.py` | Python brand constants (for backend/scripts) |
