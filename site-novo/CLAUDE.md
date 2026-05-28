# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page marketing site for **JEO BRAINS** (AI for interactive geojournalism in WordPress). It is a faithful reproduction of the approved **Figma** design — the source of truth for layout, spacing, and the canonical **PT-BR copy**. When changing text or layout, match the design rather than inventing content.

The current approved layout is **V2**, rendered to `figma-ref/desktop-v2.png` (1920×7463) from the Figma frame `JEO IA` (file `Vg86o3oBCO0BhTPh7PbduL`, node `187:708`), accessed via the Figma MCP server (Framelink: `get_figma_data` / `download_figma_images`). The older `desktop.png` (1920×6576) is the superseded V1 — prefer `figma-ref/desktop-v2.png`. To pull fresh frames/assets, reconnect the Figma MCP and re-fetch by file key + node id.

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

- **`src/App.jsx`** composes the page: it renders the section components in fixed top-to-bottom order plus the global UI — a scroll-progress bar (`useScroll`/`useSpring`) and the fixed `Header`. To reorder or add a section, edit the JSX here.
- **`src/components/Header.jsx`** is a fixed top bar (logo + nav + "Install free") that stays hidden and slides down once the page scrolls past ~50% of the hero (`scrollY > innerHeight * 0.5`). `index.css` sets `scroll-padding-top` so anchor jumps clear it.
- **One component per section** in `src/components/` (Hero, WhySection, FeaturesSection, WordPressSection, ReadySection, NewsletterSection, WorkshopsSection, TransparencySection, Footer). Section content (feature cards, steps, workshops) is defined as plain data arrays at the top of each file and mapped into markup — edit copy there.
- **`src/components/ui/`** holds reusable primitives. `Reveal.jsx` is the shared scroll-in animation wrapper used by nearly every section — prefer wrapping new content in `<Reveal>` for consistent entrance behavior. `JeoMark` is the official brand "J" mark (inlined SVG from Figma node 208:407, white strokes); `WordPressIcon` is a code-drawn WP glyph. `ParallaxImage.jsx` powers the pointer-reactive bg in Hero and Recursos: an image that drifts opposite the cursor (parallax) plus a softer-spring, blurred afterimage whose opacity is driven by pointer velocity — so a faint "trail" only fades in while the mouse is moving. Both layers are scaled up enough that the parallax offset never reveals edges; under reduced motion only the static main image renders.

### Two conventions worth knowing before editing

1. **Branded visuals are real assets extracted from Figma; only the two logos are code.** Raster assets live in `src/components/../assets/` (`src/assets/`): `hero-bg.jpg` (hero topographic background), `features-bg.jpg` (faint texture behind Recursos, used at ~7% opacity), `editor-print.png` (Gutenberg screenshot in the "Tudo pronto" section), and the footer partner logos `infoamazonia.png` / `codesinfo.png`. They are imported as ES modules so Vite fingerprints them. Two gotchas: `infoamazonia.png` has a **baked dark `#191E23` background** (no alpha), so the footer bottom bar must stay `bg-base` for it to blend; `codesinfo.png` is transparent. UI glyphs (feature/transparency/workshop icons, checkbox check) use **lucide-react**, not the Figma icon exports (those came out with component-default colors). Only `JeoMark` and `WordPressIcon` remain pure SVG.

2. **The design system is split between two files, not inline.** Theme tokens — the `brand` teal palette, `ink`/`base`/`panel`/`card-*`/`footer` background colors, `display`/`sans` fonts, and named keyframes/animations — live in `www/tailwind.config.js`. Reusable component classes (`.btn-brand`, `.btn-ghost`, `.section-shell`, `.eyebrow`) and base styles live in `@layer` blocks in `www/src/index.css`. Use these tokens/classes instead of hardcoding hex values or repeating button/container markup.

### Decisions worth preserving (don't regress)

These are choices made and reviewed in response to feedback. Treat changing them as a fresh proposal, not a "fix".

- **No particle/constellation canvas overlays.** A mouse-reactive particle network was tried over Hero and Recursos and explicitly rejected ("disconnected"). The replacement is `ParallaxImage` — parallax + velocity-driven afterimage trail. Don't reintroduce a canvas dot-network without asking first.
- **`JeoMark` is the real Figma "J" (node `208:407`)** — three nested white strokes with decreasing opacity plus a top bar, on a `0 0 27 47` viewBox. An earlier hand-drawn "fluted columns" version was rejected as off-brand. `public/favicon.svg` uses the same paths centered on a `#12181d` rounded square.
- **The favicon is *not* exported from Figma node `1:2`.** That node turned out to be the full design-system artboard (~5000×3500), not an icon. The favicon is built from the J mark above. Don't try to "fix" it by re-exporting `1:2`.
- **Hero wordmark reads "JEO BR<teal>AI</teal>NS".** The "AI" inside BRAINS is highlighted in `text-brand` — deliberate brand cue from Figma text style `ts15`, not a typo.
- **`ParallaxImage` scale values are intentional.** Hero uses `range=34` with `scale=1.22` / `trailScale=1.32`; Recursos uses `range=22` with `scale=1.15` / `trailScale=1.24`. The scales keep the parallax offset from ever revealing image edges — if you change `range`, raise the scales accordingly. The trail opacity is driven by pointer velocity (via `useVelocity`) on purpose: invisible at rest, fades in only while the mouse is moving. Don't replace it with a constant opacity.
- **`Header` reveals at `scrollY > innerHeight * 0.5`** (≈50% of the hero), slides down on a spring, and is `pointer-events-none` when hidden. `scroll-padding-top: 5rem` in `index.css` keeps anchor jumps clear of it — don't remove that rule when adding nav links.
- **Section layouts mirror Figma V2 exactly** — these aren't bugs:
  - `WhySection`: heading left, four `→ TITLE` rows on the right, each over a 2-card pair (Atualmente / Com JEO BRAINS). Not 2 or 3 pairs — four.
  - `FeaturesSection`: five cards in a 2-column grid; "Histórias perto de mim" naturally lands alone in row 3, left column.
  - `ReadySection`: uses the real `editor-print.png` screenshot — not a hand-built editor mock (an earlier `EditorMock.jsx` was deleted).
  - `Footer` bottom bar is `bg-base` so `infoamazonia.png`'s baked dark background blends.
- **No test runner / linter is being added.** Verify visually via `npm run build` + browser, not `npm test`/`npm run lint`.

### Animation

Motion is opt-in per element via Framer Motion (`Reveal`, `whileHover`, `whileInView`, gradient/float keyframes). `Reveal` and other animated components call `useReducedMotion`, and `index.css` neutralizes animations under `prefers-reduced-motion` — keep new motion behind the same guard.
