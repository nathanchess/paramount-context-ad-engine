# TwelveLabs DevEx Agent Boilerplate

## Project Vision

This repository is the **single starting point** for building TwelveLabs sample apps and demos. It includes the **Strand design system** — our internal UI/UX guideline — as a first-class dependency, pre-wired for Next.js (default), React, and Vue.

The goal: any AI agent (Cursor, Claude Code, Antigravity) should be able to generate production-quality UI that matches the TwelveLabs brand from the first prompt.

## Single Source of Truth

**Read this file before doing anything else:**

```
docs/STRANDS_AGENT_RULES.md
```

It contains the complete Strand design system specification:
- Color system (brand, masterbrand, grays, semantic UI, dark mode, product lines)
- Typography (6 font stacks, 11 size scales)
- Spacing (4px grid, layout constraints)
- Button system (6 sizes × 11 variants with hover radius-bump)
- Icons (134 SVGs, all 16×16 stroke-based)
- Mandatory rules for AI agents
- Framework-specific setup for Next.js, React, and Vue

## Repository Structure

```
├── strand/                  # Strand design system (DO NOT MODIFY)
│   ├── tokens/              # Design tokens (JSON)
│   │   ├── colors.json
│   │   ├── typography.json
│   │   ├── spacing.json
│   │   ├── radii.json
│   │   ├── shadows.json
│   │   ├── buttons.json
│   │   └── icons.json
│   ├── css/                 # CSS variables + font imports
│   ├── icons/               # 81 SVG icons
│   ├── assets/              # Logo files (full, mark, wordmark)
│   ├── components/          # Figma Code Connect mappings
│   ├── tailwind-preset.js   # Tailwind v3 preset (React/Vue)
│   └── python/              # Python brand constants
├── src/app/                 # Next.js App Router
│   ├── globals.css          # Strand tokens integrated via @theme inline
│   ├── layout.tsx           # Root layout with Strand fonts
│   └── page.tsx             # Landing page showcasing the design system
├── docs/
│   └── STRANDS_AGENT_RULES.md  # ← THE SSOT — READ THIS FIRST
├── .cursorrules             # Cursor IDE config → points to SSOT
├── CLAUDE.md                # ← YOU ARE HERE
└── .antigravity/skills/     # Antigravity Agent Skill
```

## Key Rules (Quick Reference)

1. **Never hardcode hex colors** — use Strand Tailwind classes or `var(--strand-*)` CSS variables
2. **Noto Sans is the body font**, not Inter
3. **4px spacing grid** — all spacing must be multiples of 4px
4. **Dark mode** uses `class="dark"` on `<html>`, never `prefers-color-scheme`
5. **Buttons** must use defined variants from `strand/tokens/buttons.json`
6. **Icons** are 16×16 SVG from `strand/icons/`, stroke-based with `currentColor`
7. **Content max width** is 1200px, chat max is 800px, header is 56px

## Design Philosophy

8. **No emoji in UI** — never use emoji in buttons, labels, headings, or body text
9. **White-majority aesthetic** — default background is pure white (#FFFFFF). Use #F4F3F3 sparingly for card accents. Think TwelveLabs.io, Linear, Vercel — not Bootstrap or Material UI.
10. **No login screens** — sample apps use API keys via env vars or inline input, not auth flows
11. **Professional, purposeful design** — every component must demonstrate real TwelveLabs API impact (search results, generated text, video analysis). No decorative filler.
12. **Minimalistic layout** — generous whitespace, thin borders (#E8E7E5), charcoal pill buttons with arrow icons (↗)
13. **Content-first** — lead with the user's content (video, search results, generated output), not settings panels

## When Generating Components

- Always check `docs/STRANDS_AGENT_RULES.md` for the correct token
- Import icons from `strand/icons/` — do not create new icon SVGs
- Use the logo assets from `strand/assets/` (logo-full.svg, logo-mark.svg, logo-wordmark.svg)
- Apply hover radius-bump on buttons (radius increases one level on hover)
