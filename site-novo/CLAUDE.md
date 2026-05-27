# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page marketing site for **JEO BRAINS** (AI for interactive geojournalism in WordPress). It is a faithful, pixel-conscious reproduction of the design in `desktop.png` (1920×6576) — that image is the source of truth for layout, spacing, and the canonical **PT-BR copy**. When changing text or layout, match `desktop.png` rather than inventing content.

The app lives in `www/`. All commands below run from there.

## Commands

```bash
cd www
npm install
npm run dev      # Vite dev server (http://localhost:5173)
npm run build    # production build → dist/
npm run preview  # serve the production build
```

There is **no test runner and no linter configured** — don't reference `npm test`/`npm run lint`. Verify changes by building and visually checking in the browser.

## Stack

React 18 + Vite 5, Tailwind CSS 3 (classic config + PostCSS), Framer Motion (animation), lucide-react (icons). Fonts (Archivo for display, Inter for body) load via `<link>` in `index.html`.

## Architecture

- **`src/App.jsx`** composes the page: it renders the section components in fixed top-to-bottom order and owns the only global UI — a scroll-progress bar driven by `useScroll`/`useSpring`. To reorder or add a section, edit the JSX here.
- **One component per section** in `src/components/` (Hero, WhySection, FeaturesSection, WordPressSection, ReadySection, NewsletterSection, WorkshopsSection, TransparencySection, Footer). Section content (feature cards, steps, workshops) is defined as plain data arrays at the top of each file and mapped into markup — edit copy there.
- **`src/components/ui/`** holds reusable primitives. `Reveal.jsx` is the shared scroll-in animation wrapper used by nearly every section — prefer wrapping new content in `<Reveal>` for consistent entrance behavior.

### Two conventions worth knowing before editing

1. **All visuals are pure CSS/SVG — there are no raster image assets.** `TopoBackground` (procedural topographic hero lines), `JeoMark` (the pillar logo), `WordPressIcon`, and `EditorMock` (a hand-built replica of the Gutenberg editor screenshot) are all code. Recreate visuals in markup/SVG rather than importing images.

2. **The design system is split between two files, not inline.** Theme tokens — the `brand` teal palette, `ink`/`base`/`panel`/`card-*`/`footer` background colors, `display`/`sans` fonts, and named keyframes/animations — live in `www/tailwind.config.js`. Reusable component classes (`.btn-brand`, `.btn-ghost`, `.section-shell`, `.eyebrow`) and base styles live in `@layer` blocks in `www/src/index.css`. Use these tokens/classes instead of hardcoding hex values or repeating button/container markup.

### Animation

Motion is opt-in per element via Framer Motion (`Reveal`, `whileHover`, `whileInView`, gradient/float keyframes). `Reveal` and other animated components call `useReducedMotion`, and `index.css` neutralizes animations under `prefers-reduced-motion` — keep new motion behind the same guard.
