# JEO Maps — Landing page

Single-page marketing site for **JEO Maps** — geographic intelligence in
WordPress. A faithful reproduction of the approved **Figma v3 redesign**
(frame `jeo-maps-landing-redesign`, node `133:1531`, rendered to
`../figma-ref/desktop-v3.png`; token inventory in
`../figma-ref/redesign-v3-tokens.md`), in PT-BR and English.

## Stack

- **React 18** + **Vite 5** (dev server at `/novo` — `base: '/novo'`)
- **Tailwind CSS 3** — `v3-*` design tokens in `tailwind.config.js`
- **Framer Motion** — scroll-in reveals and microinteractions
- **lucide-react** — icons
- **i18n** — dependency-free: React context + dictionaries in `src/i18n/`
  (`pt-BR` default, `en`), persisted in `localStorage['jeo-lang']`

## Running

```bash
npm install
npm run dev      # http://localhost:5173/novo
npm run build    # production build → dist/
npm run preview  # serve the production build
```

No test runner or linter is configured — verify with `npm run build` and a
visual pass (desktop 1920 + mobile 390, PT-BR + EN).

## Structure

```
src/
├── App.jsx                  # section composition + scroll-progress bar
├── index.css                # Tailwind base + v3 component classes (@layer)
├── links.js                 # external destinations (download, docs, github)
├── i18n/
│   ├── index.jsx            # provider/hook, language persistence
│   └── pt-BR.js / en.js     # all user-facing copy (namespaced per section)
└── components/
    ├── Header.jsx           # sticky navbar, anchors, language switcher
    ├── Hero.jsx             # hero with layered animated illustration
    ├── ResourceSlider.jsx   # resource tabs + panel cards (#recursos)
    ├── FeaturesShowcase.jsx # 5 alternating feature rows (#inteligencia-artificial)
    ├── HowItWorks.jsx       # 3 staggered step cards
    ├── LiveDemo.jsx         # browser mockup + video + CTA (#experimente)
    ├── WorkshopsV3.jsx      # workshop form (placeholder) + community box (#oficinas)
    ├── FooterV3.jsx         # wordmark, nav, terms modal, partner logos
    ├── ConsentBanner.jsx    # first-visit cookie/terms notice
    └── ui/Reveal.jsx        # shared reduced-motion-aware scroll-in wrapper
```

## Conventions

- Copy lives only in the i18n dictionaries; headings use
  `.font-condensed` + `uppercase` (mixed-case strings, CSS does the caps).
- Containers use `.section-shell-v3` (1600px max-width + inset padding);
  buttons use `.btn-v3-primary` / `-ghost` / `-secondary`; labels use
  `.eyebrow-v3` — all defined in `src/index.css`.
- Every animation guards `prefers-reduced-motion`; the demo video degrades
  to its poster under it.
- External links are centralized in `links.js` and always open in a new tab.
- Assets under `src/assets/` are Figma exports (`v3-*`), plus the reused
  `hacklab-logo.svg` and `print-animado.mp4` (Live Demo video).
