# TwelveLabs DevEx Agent Boilerplate

![TwelveLabs DevEx Agent Boilerplate](public/thumbnail.png)

An AI-agent-optimized boilerplate for rapidly building TwelveLabs sample apps using the internal **Strand** design system. Pre-configured for **Cursor**, **Claude Code**, and **Antigravity**.

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### 1. Clone & Install

```bash
git clone https://github.com/nathanchess/tl-devex-agent-boilerplate.git
cd devex-agent-boilerplate
npm install
```

### 2. Run the Dev Server (Next.js)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the branded landing page showcasing the Strand design system.

---

## Using with AI IDEs

This boilerplate is designed to work with AI coding assistants out of the box. Each IDE automatically reads the Strand design system rules.

### Cursor

The `.cursorrules` file at the repo root instructs Cursor to follow `docs/STRANDS_AGENT_RULES.md`. **No additional setup needed** — just open the project in Cursor and start prompting.

### Claude Code

The `CLAUDE.md` file at the repo root establishes the project vision and points to the SSOT. Claude Code reads this automatically on session start.

### Antigravity

The `.antigravity/skills/twelvelabs_ui/SKILL.md` agent skill activates whenever UI files are generated or modified. It enforces all Strand rules, including a validation checklist.

---

## Framework Support

While the boilerplate ships as a **Next.js** app, the Strand design system is framework-agnostic. All tokens are available as JSON, CSS custom properties, and a Tailwind v3 preset.

### Next.js (Default)

Already configured. Tokens are in `src/app/globals.css` via Tailwind v4's `@theme inline` block.

### React (Vite / CRA)

1. Copy the `strand/` folder into your React project
2. Configure Tailwind:

```js
// tailwind.config.js
const strandPreset = require('./strand/tailwind-preset.js');
module.exports = {
  presets: [strandPreset],
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
};
```

3. Import fonts and variables in your entry CSS:

```css
/* src/index.css */
@import '../strand/css/fonts.css';
@import '../strand/css/variables.css';
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Vue

1. Copy the `strand/` folder into your Vue project
2. Configure Tailwind (same as React):

```js
// tailwind.config.js
const strandPreset = require('./strand/tailwind-preset.js');
module.exports = {
  presets: [strandPreset],
  content: ['./src/**/*.{vue,js,ts,jsx,tsx}'],
};
```

3. Import fonts and variables:

```css
/* src/assets/main.css */
@import '../../strand/css/fonts.css';
@import '../../strand/css/variables.css';
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Or use **raw CSS variables** without Tailwind:

```vue
<style>
@import '../../strand/css/variables.css';
@import '../../strand/css/fonts.css';

.my-component {
  background: var(--strand-ui-background);
  color: var(--strand-ui-text-primary);
  font-family: var(--strand-font-system);
}
</style>
```

---

## Repository Structure

```
├── strand/                      # Strand design system (source of truth for tokens)
│   ├── tokens/                  # Design tokens (JSON)
│   │   ├── colors.json          #   Color palette (brand, gray, semantic, product)
│   │   ├── typography.json      #   Font families and size scale
│   │   ├── spacing.json         #   Spacing, sizing, layout
│   │   ├── radii.json           #   Border radius
│   │   ├── shadows.json         #   Box shadows
│   │   ├── buttons.json         #   Button sizes, variants, hover behavior
│   │   └── icons.json           #   Icon manifest
│   ├── css/
│   │   ├── variables.css        #   All tokens as CSS custom properties
│   │   └── fonts.css            #   Font @import declarations
│   ├── icons/                   #   81 SVG icons (16×16, stroke-based)
│   ├── assets/                  #   Logo files (full, mark, wordmark)
│   ├── components/              #   Figma Code Connect mappings
│   ├── tailwind-preset.js       #   Tailwind v3 preset (for React/Vue)
│   └── python/brand.py          #   Python brand constants
│
├── src/app/                     # Next.js App Router
│   ├── globals.css              #   Strand tokens via Tailwind v4 @theme inline
│   ├── layout.tsx               #   Root layout with Strand fonts
│   └── page.tsx                 #   Landing page (design system showcase)
│
├── docs/
│   └── STRANDS_AGENT_RULES.md   #   ★ THE SSOT — complete design system spec
│
├── .cursorrules                 #   Cursor IDE → reads SSOT
├── CLAUDE.md                    #   Claude Code → project vision + SSOT
├── .antigravity/skills/
│   └── twelvelabs_ui/SKILL.md   #   Antigravity → agent skill enforcing Strand
│
└── README.md                    #   ← You are here
```

---

## Key Design Rules

These rules are enforced by all AI IDE configurations:

| Rule | Details |
|------|---------|
| **No hardcoded hex colors** | Use Strand Tailwind classes or `var(--strand-*)` CSS variables |
| **Noto Sans, not Inter** | Primary body font is Noto Sans; Inter is legacy fallback only |
| **4px spacing grid** | All spacing values must be multiples of 4px |
| **Dark mode via class** | Add `class="dark"` to `<html>` — never use `prefers-color-scheme` |
| **Button variants only** | 6 sizes × 11 variants from `strand/tokens/buttons.json` |
| **Hover radius bump** | Button border-radius increases one token step on hover |
| **Icons: 16×16 SVG** | Use icons from `strand/icons/`, stroke-based with `currentColor` |
| **Max widths** | Content: 1200px, Chat: 800px, Header height: 56px |

For the complete specification, see **[docs/STRANDS_AGENT_RULES.md](docs/STRANDS_AGENT_RULES.md)**.

---

## Token Quick Reference

### Colors

| Category | Example Classes | Example Hex |
|----------|----------------|-------------|
| Brand | `bg-brand-green`, `text-brand-charcoal` | `#00FF00`, `#1D1C1B` |
| Semantic | `bg-background`, `bg-surface`, `bg-card` | Auto light/dark |
| Text | `text-text-primary`, `text-text-secondary` | Auto light/dark |
| Accent | `bg-accent`, `hover:bg-accent-hover` | `#00DC82` |
| Product | `bg-product-search`, `bg-product-generate` | `#F6AFFF`, `#FABA17` |

### Gradient

```css
background: linear-gradient(90deg, #60E21B, #FABA17, #FFB0CD);
```

### Fonts

| Stack | Tailwind | Fonts |
|-------|----------|-------|
| Brand | `font-brand` | Milling Duplex 1mm → Noto Sans → Helvetica |
| System | `font-system` | Noto Sans → Helvetica → Arial |
| Code | `font-mono` | IBM Plex Mono |

---

## Contributing

1. **Do not modify `strand/`** — it's the canonical design system. Changes go through the design team.
2. Always run `npm run build` before committing to verify the build passes.
3. When adding new components, follow the patterns in `docs/STRANDS_AGENT_RULES.md`.
4. When using an AI IDE, let it know you're in this boilerplate — it will auto-apply the rules.

---

## License

Private — TwelveLabs internal use only.
