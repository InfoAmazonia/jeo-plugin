# Redesign v3 — Animation Reference (prototype × implementation)

Reference doc for issue #669 (landing redesign, motion slice). Maps every
animation **expected by the Figma prototype** to what the code does today.

## Method & limitations

- **Figma desktop MCP**: `get_design_context` / `get_metadata` do **not** expose
  prototype reactions/interactions, and `hero-animate` (133:418) is a plain
  component (no variant set). Static file data alone therefore proves nothing
  about motion.
- **Prototype ground truth**: the prototype was opened in Chrome
  (`node-id=133-1531`) at 1920×914, dpr 1. Content offset measured as
  **viewport_y = figma_y + 130** (x is 1:1; verified against sparkle vector
  bounding boxes). Screenshots were diffed programmatically with a pure-node
  PNG decoder (`/tmp/opencode/pngdiff*.mjs`, no new dependencies): per-tile
  heatmaps, named-region deltas, integer-shift cross-correlation (translation
  vectors), and fixed-point color series.
- **Prototype timing (2026-09-18, F3 slice)**: screenshot series and recorded
  webm both fail here (round-trip latency 12–18 s; MediaRecorder webm has no
  seek index → decoded seeks repeat keyframes). The reliable method:
  **live frame sampling** — `canvas.captureStream(60)` of the player canvas →
  `<video>` → `requestVideoFrameCallback`, per-presented-frame metrics
  computed in-page (white fraction, centroid, row bounds, exact-color
  counts), timestamps from the stream's `mediaTime`. Figma's canvas repaints
  on demand, so frames are change-driven (sparse but unambiguous order) —
  timing comes from the mediaTime clock, not frame counting.
- Environment cannot read images visually; all conclusions below come from
  the numeric evidence.
- Hero steady state sampled ~5 min into prototype lifetime (10 frames at
  ~1.05 s). Entrance sampled at t=0–7 s (5 frames).

## Hero illustration (`hero-animate` instance 133:1582)

> **SUPERSEDED by the official export (2026-09-16):** the hero fold now runs
> the official Lottie animation `find-location.json` (793×480, 60fps, 4s)
> inserted via lottie-web — the source of truth replaces the manual
> PNG-layer recreation. Keyframe inspection of the JSON: all opacity/scale
> tracks are monotonic entrances settling at frame 240 (opacity 100, scale
> [100,100]) with **no return keyframes** → play-once + hold (looping would
> hard-cut to the hidden initial state and replay the pop-in). The prototype
> measurements below are kept as historical evidence of the design intent.

Element boxes (figma page coords): txt 972–1315 × 262–527 · maps 1386–1698 ×
362–595 · sparkle2 1428–1471 × 209–252 · sparkle1 1613–1645 × 263–294 ·
pin 1511–1573 × 234–297 · search 1494–1612 × 215–334.

### Observed in the prototype

1. **Rotating emphasis cycle** — element groups animate in strict sequence,
   then rest. Measured over 9 consecutive ~1.05 s intervals (changed px):

   | interval | txt | maps | pin+search | sparkles |
   |---|---|---|---|---|
   | 1→2 | 3 | 0 | **4764** | 808/737 |
   | 2→3 | 3 | **30707** | 3840 | 419/776 |
   | 3→4 | 0 | **30706** | 3820 | 420/771 |
   | 4→5 | 0 | **25969** | 3819 | 426/762 |
   | 5→6 | 0 | **25955** | 3822 | 428/762 |
   | 6→7 | **38710** | 0 | 1259 | 0/0 |
   | 7→8 | **38877** | 0 | 4714 | 413/736 |
   | 8→9 | 0 | 0 | **12596** | 412/751 |
   | 9→10 | 12420 (bottom lines) | 0 | **10608** | 0/15 |

   Phases: **maps ≈ 4 s → txt ≈ 2 s → pin/search ≈ 2–3 s → repeat** (master
   cycle ≈ 8–10 s).

2. **Per-phase behavior** (cross-correlation + color series):
   - **maps**: cards move outward/down with per-card vectors road(−19,+20),
     contour(−18,+7), bus(+18,+20), voronoi(−17,+19) (px over ~1 s) — a
     spread/scale pulse; glyphs also flash brighter mint (#03B48E sampled
     mid-burst). Residual MAD stays high after best shift → scale/brightness,
     not pure translation.
   - **txt**: no coherent translation (best shift ≈ 0, <2 % improvement);
     bottom two skeleton lines change most (line at figma y≈482: MAD 43.7) —
     an **opacity/shimmer flash**, like a skeleton-loading pulse.
   - **pin+search**: rigid translation (shift (1,+30), 33 % improvement) —
     the cluster **dips down ~30 px** during its phase, then returns.
   - **sparkles**: gentle continuous pulse (~400–800 px/interval), pausing
     during the txt phase.
   - **pin+search baseline**: ~3.8 k px/interval of small motion even outside
     its phase (continuous subtle float).
3. **Static**: hero left column (real text) 0 px in every interval; navbar 0
   (post-entrance).
4. **Entrance (t=0–7 s)**: whole-fold settle in the first ~1.5 s; pin/search
   region active from t=0; illustration-wide reshuffle t≈3–7 s settling into
   the rotation cycle.

### Implementation status (Hero.jsx)

| Element | Source | Status |
|---|---|---|
| illustration (all layers) | official Lottie `src/assets/animations/find-location.json` via `ui/Lottie.jsx` (lottie-web, SVG renderer, play-once + hold) | **ok** — replaces the manual cascade/cycle/floats; the manual layer PNGs were removed |
| reduced-motion | `Lottie` jumps to `goToAndStop(totalFrames-1)` — static settled frame; hero bg `<video>` not rendered (static navy + gradient) | **ok** |
| left column / navbar | stagger container 0.12 s (Hero.jsx) | **ok** |
| background | fill stack of frame `133:1553`, bottom→top: official video `src/assets/hero-background.mp4` (V2-history asset, md5 `c32c7b68…`, 9.4 MB hashed static asset) `autoplay muted loop playsInline` at `opacity-80 object-cover` → `#0A1628` solid `mix-blend-color` → `#0A1628`/90 solid → vertical gradient `to top transparent→#0A1628`; all `-z-10` under content/Lottie | **ok** (2026-09-16) |

## Resource slider (`slider-recursos geais` 133:1583)

| Element | Expected (evidence) | Implemented today | Status |
|---|---|---|---|
| Tab click | swaps panel; selected label brightens, tab row persists (9.2 % region change measured); transition completes < ~0.6 s after click (Figma smart-animate default 300 ms presumed — not resolvable with capture latency) | `AnimatePresence mode="wait"`, fade + rise 16 px, 0.35 s (ResourceSlider.jsx) | **ok** |
| Tab hover | untested in proto (incerto) | opacity 50→80 transition | ok (incerto) |
| Panel print media | node `print-animado 1` (I133:1583;442:1776) was a VIDEO fill in the proto; the 2026-09-16 official Lottie exports replace it | official Lottie per tab via `ui/Lottie.jsx`, dynamic-imported JSON chunks (ResourceSlider.jsx) | **ok** — details below |
| Auto-advance | not observable in the proto (manual tabs) | **8 s per tab, cycling 1→2→3→4→1 forever** (human decision 2026-09-18: 2 s → 6 s → 8 s). The advance is indistinguishable from a click (panel swap + `mediaKey` bump → replay). Manual click selects AND restarts the 8 s window; paused while the section is off-screen (IntersectionObserver) and while `document.hidden` (fresh 8 s window on return); **disabled entirely under `prefers-reduced-motion`** (manual only). `setTimeout` with clean reset (no loose `setInterval`), cleared on unmount — `ResourceSlider.jsx` `AUTO_ADVANCE_MS` | **ok** — measured 2026-09-18: deltas 8101/7999/8001 ms over 3 advances; click → next advance 8007 ms; 50 s off-screen → no advance; 38 s hidden → no advance; reduced-motion → no advance in 20 s |

### Official Lottie exports per tab (2026-09-16)

All four export at 60 fps, `ip=0 op=227` (3.78 s). Loop × play-once was decided
per file by inspecting the final keyframes of every animated track (same
method as the hero): does the **visible** state at `op` return to the state at
`ip` (loop) or settle away from it (play-once + hold)?

| Tab | File (`src/assets/animations/`) | Comp | Layers | Decision | Keyframe evidence |
|---|---|---|---|---|---|
| 1 Geolocalização | `localisation.json` ("Frame 6") | 665×418 | 13 | **play-once + hold** | every opacity track is a monotonic entrance 0→100 (ends t≈68–77); all 11 position tracks drift for the full 228 frames and end displaced (e.g. y 97.5→67.5) with no return keyframes — a loop would hard-cut visible content off and replay the entrances |
| 2 Mapas & Camadas | `layers.json` ("Frame 21") | 665.94×409 | 4 | **play-once + hold** | same signature: opacities 0→100 entrances; positions descend ~70 px across the whole clip (49→119 … 220→290), end ≠ start, no returns |
| 3 Contar histórias | `map.json` ("storymap") | 665×363.14 | 8 | **loop** | the timeline contains **two full card waves** (t0–90, t91–189); at `op` every *visible* track is back at its `ip` state — `game-icons:brazil` opacity 70→70 / scale 85→85, the 5 transient rectangles and Vector 25 faded to opacity 0 (their t0 state, invisible), background (`print-animado 1` layer) static — so the loop point is seamless; the t189–227 hold reads as a rest beat between cycles |
| 4 Explorar dados | `explorar.json` ("Frame 23") | 665×418 | 32 | **play-once + hold** | 6 `News` icons pop in (scale 60→100, opacity 0→100, staggered t39–114), 12 vector tracks fade in by t150 with small terminal drift (≈+5/+16–21 px) — entrances settle, nothing returns |

Replay on activation: clicking a tab (including the already-active one) bumps a
`mediaKey` that remounts the `Lottie` player from frame 0 — a fresh entry per
activation, like the proto. The looping `map.json` simply restarts its cycle on
re-click and otherwise runs continuously while visible (the wrapper pauses it
off-screen / on hidden tabs via `IntersectionObserver`).

Geometry: the four comps have different heights (418/409/363/418). All four
render inside **one fixed slot, `aspect-[665/418]` at `lg:w-[665px]`** (the
Pain Card 1 media box, the tallest ratio): the lottie SVG renderer contains
and centers each comp (`preserveAspectRatio: xMidYMid meet`), so `map.json`
and `layers.json` letterbox inside the slot instead of changing the panel
height — no jump between tabs.

#### Tab 2 "Mapas & Camadas" — code composition replacing `layers.json` (2026-09-18)

> **SUPERSEDED (2026-09-18, later the same day) — human decision.** The
> reversion described below was **suspended by the human** mid-slice:
> `MapsLayersMedia.jsx` and its `v3-tab2-*` crops are **not in the tree** and
> must not be recreated. Tab 2 runs the **official `layers.json` export**
> through `ui/Lottie.jsx` like its siblings; the four missing photo bitmaps
> were **fabricated** from the design render and ship as
> `www/public/i/{ecbd0b36…,a043a878…,08621d54…,26bf3786…}.png`
> (**REPLACED 2026-09-21 by the designer's official masters — see "Tab 2
> official photo masters" below**), wired by `remapLottieAssets` (the export
> sets `e:1`, so the prefix is folded into `p` — see the helper's
> docstring). Kept below for
> the record of the observed proto behavior (drop curve ±7 px overshoot,
> onsets 0.02/0.32/0.58/0.92 s), still valid as the score `layers.json`
> plays.

The official `layers.json` export ("Frame 21", 665.94×409 @ 60 fps) never
shipped its **photo bitmaps** (the exporter dropped the diamonds' image
fills — same defect as the Feature 1 handoff), so the Lottie rendered the
four layer diamonds as flat translucent vectors. The code composition below
(**removed — see the supersede note above**) was:

- **Observation** (live sampling of the proto, tab 2 clicked): the media
  **loops the export's timeline** — period ≈3.95 s (= 227 frames @ 60 fps +
  restart gap): the four photo-filled diamonds drop in **bottom-up**, hold
  ~2.3 s, hard-cut to empty and replay. The settled frame was captured from
  the prototype canvas (readback via the captureStream 2d context /
  screenshot, `v3-tab2-settled.jpg`) — its mint bottom-edge bands
  (local y 232-240 / 296-304 / 356-360 / 404-408) match the export's diamond
  positions within ±1.5 px, tying the video to the comp.
- **Items**: four crops of the settled frame at each diamond's final bbox
  (`v3-tab2-d1..d4.jpg`, JPEG q96 4:4:4 — photo content; navy corners match
  the flat `#0A1629` media bg, stray JPEG deltas ≤12 confined to 53 px by
  busy edges), replayed over a CSS navy background. Settled composite vs the
  captured frame: ≤1 channel step pre-JPEG.
- **Score** (from the export's baked position tracks — the `y` arrays in the
  component ARE the 60 fps keyframe series, same technique as the F1 pins):

  | Layer | enters (frame→s) | settle | curve | opacity |
  |---|---|---|---|---|
  | d1 bottom (mint) | 1 → 0.02 s | 0.62 s | B (slow) | 0→100 f0-8 |
  | d2 (pale) | 19 → 0.32 s | 0.92 s | A (fast) | f18-27 |
  | d3 (white) | 35 → 0.58 s | 1.20 s | B | f35-41 |
  | d4 top (mint 24 %, photo tip) | 55 → 0.92 s | 1.52 s | A | f54-61 |

  Both curves share the shape: ~7 px pre-rise, 70 px fall, ~7.3 px overshoot
  (10.5 %), settle by frame 36-38; opacity ramps use the designer bezier
  `(0.33,1)/(0.68,1)`.
- **Compromise, documented**: the crops of overlapping translucent layers
  carry the settled pixels of the layers above them, so mid-flight blends
  ghost slightly in the overlap zones; the settled state is pixel-faithful.
- **Behavior**: play-once + hold per activation (the wrapper's `mediaKey`
  remounts on every tab click — same contract as the sibling play-once
  Lotties); `prefers-reduced-motion` shows the settled frame image.
  `layers.json` stays in the repo verbatim, **unloaded**; its 92 KB chunk is
  no longer fetched (replaced by ~575 KB of lazy JPEGs delivering the
  complete art).

#### Tab 2 official photo masters (2026-09-21)

The designer delivered the four diamond photos as `layer-1..4.png`
(1267×~490 RGBA each, ~2× the strip size, **diamond alpha baked in** —
~46 % transparent corners; layer-1's interior is alpha 239, the others are
opaque 255). They **replace the fabricated crops** in `www/public/i/`
(human decision: align layer-N with diamond N **in animation order**). The
score/timings in `layers.json` are untouched — only the 4 asset `p` refs
changed extension (`.png` → `.jpg`; hashes stay, `remapLottieAssets` needs
no change):

| Master | Diamond (animation order) | Photo layer | Asset (`public/i/`) | Final strip pos (comp) |
|---|---|---|---|---|
| `layer-1.png` (contour gradient, alpha 239) | d1 — first drop, **bottom** | `photo Vector 2` (ind 104) | `26bf3786….jpg` | (16.52, 170.95), 634×243 |
| `layer-2.png` (city streets) | d2 | `photo Vector 1` (ind 103) | `08621d54….jpg` | (16.52, 120.88), 633×243 |
| `layer-3.png` (teal abstract + dots) | d3 | `photo Vector 3` (ind 102) | `a043a878….jpg` | (16.52, 60.80), 633×243 |
| `layer-4.png` (satellite) | d4 — last drop, **top** | `photo Vector 4` (ind 101) | `ecbd0b36….jpg` | (16.52, −3.29), 632×242 |

Onset evidence for the order (baked keyframes, first frame moving): d1 f1
(0.02 s) → d2 f19 (0.32 s) → d3 f35 (0.58 s) → d4 f55 (0.92 s).

**Mask/geometry**: the diamond shape still comes from the Lottie itself —
each `photo` layer is alpha-matted (`tt:1`) by the vector layer above it
(`td:1`), an invisible 9-vert parallelogram (~623×236, beveled tips). The
masters' baked diamond is full-bleed, so a naive drop-in would misplace the
baked mint stroke ~5–11 px past the matte boundary (navy wedges inside the
diamond). Instead each master was **perspective-warped so its four diamond
tips land exactly on the vector diamond's four tips** (bevel midpoints:
T(333.425, 0.84) R(644.01, 111.07) B(333.425, 236.905) L(21.12, 111.07) in
layer space, anchor (332.5, 119), world = finalPos + v − anchor, strip-local
= world − stripPos, output at 2× the declared strip size). Non-uniform
scale ≤ 1.7 %, invisible on map art; the matte clips any residual. layer-1's
alpha-239 translucency sits at the bottom of the z-stack (only the navy
`#0A1629` media bg beneath), so flattening it over navy is pixel-identical
to rendering the alpha. **JPEG q75 4:4:4** (display-size diff vs lossless:
mean |Δ| ≈ 1.0–1.4, imperceptible): 53.6 + 120.1 + 51.2 + 66.5 =
**291.3 kB total** (target ≤ ~300 kB; q88 was 442 kB). The fabricated PNGs
were deleted (no other references).

**Verification** (preview build, 2026-09-21): drop series sampled from the
SVG transforms — onsets d1→d4 with gaps ≈ 0.3 s (score 0.30/0.26/0.34),
overshoots +6.8/+7.1/+6.8 px (9.8–10.2 %; score ~7.3 px/10.5 %), settle
exact to 4 decimals (170.9527/120.8820/60.7972/−3.2933), hold to op=227;
diamond regions non-navy with each master's palette (navy bg reads exactly
#0A1629); replay on re-click of the active tab restarts from frame 0;
auto-advance deltas 8.01/8.08 s; reduced-motion shows the static settled
frame (frozen at final transforms) with the new photos and no auto-advance;
console clean; no horizontal overflow at 1920 or 390.

**Tab 2 shadow removal + master permutation (2026-09-22).** The four matte
donor layers (`Vector 1..4`, `td:1`) each carry an AE **Drop Shadow** effect
(`ty:25`, color `#00DBA6`, opacity 255, angle 180, distance 8, blur 0).
lottie-web renders the donors visibly and applies the effect as an SVG
`feDropShadow`-style filter — the hard 8 px-down full-strength copy of each
diamond read as a dark band under diamonds d2/d3/d4 (d1's copy falls below
the comp bottom and is clipped by the container, so it never showed).
Surgical fix: `opacity` param of the effect set **255 → 0** on `Vector 4`
(ind 1), `Vector 3` (ind 2) and `Vector 1` (ind 3) only — the filter element
is preserved (removing the whole `ef` drops the group's filter isolation and
changes the stack's blend appearance; verified experimentally). `Vector 2`
(d1) untouched at this step (zeroed later — see the follow-up note below). Same day: d1/d2 assets regenerated from the designer's
updated masters — d1 ← `layer-2.png` (city streets, 1267×490, md5
`aa07a3b5…`), d2 ← `layer-1.png` (contour gradient, alpha-239 interior
flattened over navy as before); same warp recipe (master tips → vector bevel
midpoints per diamond, 2× strip, JPEG q75 4:4:4), same asset hashes
(`26bf3786…` md5 `3f749679…`, `08621d54…` md5 `a2137000…`). d3/d4 assets
untouched (d4 keeps the brightness-1.30/contrast-1.05 fix, center luminance
≈157). Timings/replay/auto-advance/reduced-motion untouched. Verified: band
zones under d2/d3/d4 back to the underlying layer's pixels (no dark
gradient), region below d1's tip flat navy (std 0.00), console clean at
1920 and 390.

**Tab 2 rim bake + warp v2 (2026-09-22, follow-up).** The green rim belongs
to the masters, not to the Lottie effect: `layer-1..4.png` already carry a
thin teal band (~#00DBA6) along the LOWER diamond edges (R–B, B–L and the
L/R/B tips; upper edges have no rim) and no shadow. All four donor Drop
Shadow effects are now `opacity 255 → 0` — `Vector 2` (d1) zeroed too, so
the four rims come uniformly from the baked bitmaps. The four bitmaps were
regenerated with warp v2 (`/tmp/opencode/gen-tab2.py`): instead of aligning
the master tips to the matte's bevel midpoints (which ate 2–7 px of rim
along the long edges and forced the −5.4/−5.5 px anchor nudge on d3/d4),
the master's OUTER contour (rim included, from the alpha bbox tips
T(633,0) R(1266,244) B(633,489) L(0,244)) now lands on the matte octagon's
VIRTUAL SHARP TIPS (intersection of the extended long edges: T(333.43,0)
R(665.0,110.6) B(333.42,238.0) L(0.01,110.6) in layer space). With full
coverage the d3/d4 anchor nudge became redundant and was reverted — the
four `photo Vector *` layers are back to `ks.a [0,0]`, exactly as exported.
d4 keeps the alpha-flatten + brightness 1.30/contrast 1.05 treatment under
the new warp (asset interior mean luminance ≈158). Timings, drop order,
replay and auto-advance untouched (JSON diff = 4 opacity values only).
Asset md5s: d1 `26bf3786…` `5a903a4e…`, d2 `08621d54…` `9f5e609c…`, d3
`a043a878…` `46e238cd…`, d4 `ecbd0b36…` `d2143896…`. Verified (preview
build, reduced-motion settled frame): teal rim sampled on R–B and B–L of
all four diamonds at 1920 and 390 (20–37/37 hits), no navy sliver below
d1's bottom tip (exact #0A1629), no dark band under d2/d3/d4, d4 asset
luminance ≈158, console clean (only external CORB on googletagmanager).

## Features Showcase (133:1584)

### Feature 1 — "Geolocalização assistida por IA" (row media, Group 17 `133:1593`)

**Reconstruída via código a partir da partitura rec-1 (2026-09-18).** O export
Lottie segue sem o bitmap (`i/a7d3af06….png` nunca entregue), mas a parte
**animada** do comp é 100 % vetorial e legível no JSON — os três "Location
pin" precomps foram re-codificados como SVG inline no
`FeaturesShowcase.jsx` (`GEO_PINS`), animados por Framer Motion sobre um
fundo inpaintado (`v3-feature-1-bg.png` = o PNG estático menos os pins
assados). O **Lottie original continua no repo verbatim**; o re-wire via
`ui/Lottie.jsx` permanece **opcional** para quando o bitmap chegar (checklist
abaixo).

**Tabela da partitura** (parse por-frame do JSON; comp 692×384 @ 60 fps,
`ip=0 op=240`; posições em unidades do comp, anchor do pin em (14,20) do
vetor 28×40):

| Layer (ind) | O que é | Fill | x | Queda (frames → s) | y início → pico@t → final | Travel / overshoot | Opacidade |
|---|---|---|---|---|---|---|---|
| 4 | pin destaque | `#00A67E` | 401 | 0→30 (0.50 s) | 22.61 → 228.98@t17 → 210.61 | +188 px / 9.8 % | 0→100 t0–6, bezier `(0.33,1)/(0.68,1)` (keyframes reais, não baked) |
| 3 | pin | `#5B5F62` | 324 | 36→66 (0.50 s) | 13.61 → 92.65@t53 → 85.61 | +72 px / 9.8 % | ramp baked t36–65 (coincide com o bezier acima) |
| 2 | pin | `#5B5F62` | 578 | 52→81 (0.48 s) | 3.61 → 82.65@t68 → 75.61 | +72 px / 9.8 % | ramp baked t52–80 (idem) |

Os tracks de **posição** vêm *baked* por frame (241 keyframes cada — o easing
foi queimado na amostragem de 60 fps), então a leitura por endpoints
("drifts verticais one-way", registrado aqui antes desta fatia) é
incompleta: o parse por-frame revela **queda rápida + overshoot de ~9.8 % +
assentamento** — curva normalizada idêntica nos três pins. No código, cada
array `y` É a série de keyframes (amostragem uniforme → interpolação linear
entre amostras de 60 fps, `ease: 'linear'`); a opacidade usa o bezier do
próprio export. Demais layers do comp (ícones "Frame"/"Frame 37", shapes de
borda, o bitmap ×2 com máscaras) são **estáticas** — no estado final
coincidem com o PNG, que as carrega.

**Geometria dos pins**: beziers copiados dos `sh` dos precomps (todos os
três assets de pin compartilham o mesmo vetor 28×40 com ponto interno
evenodd — o "branco" do ponto no PNG é o mapa por trás, confirmado no
Figma: Vector único com fill sólido, sem segundo fill branco). `world =
pinPos + (shape − (14,20))`; verificação contra o PNG: topo do pin verde em
y=191 (previsto 190.61), anéis de cor a ±5 px do centro previsto —
alinhamento ≤ 1 px.

**Fundo inpaintado** (`v3-feature-1-bg.png`, 692×384): máscara = bboxes
finais dos pins (28×40) + margem 5 px; OpenCV indisponível no ambiente (sem
módulo `cv2`, sem `pip`) → **difusão harmônica (Laplace) pura-PIL** com halo
de 10 px, 900 iterações de Jacobi + grão gaussiano (σ = 0.4× std do anel
conhecido). Validação: std interno 14.5–20.8 vs anel 32–36 (textura
plausível, não buraco uniforme); **zero pixels residuais** das cores dos
pins (tolerância 24) nas três regiões. O PNG **original permanece
intocado** (`v3-feature-1.png`) e é o fallback de `prefers-reduced-motion`
e de erro de load do fundo — nunca um card visivelmente quebrado.

**Comportamento implementado** (`GeolocationMedia`/`GeolocationPin` em
`FeaturesShowcase.jsx`): play-once ao entrar na viewport
(`useInView amount 0.25`) com **replay por re-entrada** (padrão da fatia e
mesmo comportamento do re-wire planejado); assentamento exato nas posições
finais do JSON; SVG inline (sem chunks), custo medido no main bundle:
**+3.0 kB raw / +1.31 kB gzip**.

**Intake kept ready for the optional re-wire:** delivered by the designer as
`rec-1.json` (comp "Frame 17"), copied verbatim (md5 `ba4ab3e8…`) to
`src/assets/animations/feature-geolocalizacao.json`. Comp **692×384 @ 60 fps**,
`ip=0 op=240` (4 s), 13 root layers + 5 precomps + 1 embedded bitmap — whose
asset id (`a7d3af06…`) is the same `imageHash` the Figma node's IMAGE fills
reference, tying the export to node `133:1593`. (History: the 2026-09-17
revert restored `v3-feature-1.png` by cropping `figma-ref/desktop-v3.png`
at the Group 17 bounds, x=1068/y=2459, 692×384.)

**Loop × play-once (established keyframe method):** 6 animated tracks, all on
the three "Location pin" layers — the 3 opacity tracks are monotonic 0→100
entrances and the 3 position tracks are one-way vertical drops with **no
return keyframes**. A loop would snap visible pins back to their hidden
initial state and replay the entrances → **play-once + hold**, as expected
for row media — and exactly what the code reconstruction implements (with
replay on re-entry).

**Re-wire checklist (OPTIONAL now — the code reconstruction above already
restores the motion; re-wire only if the full-Lottie fidelity is wanted when
the bitmap lands; the two props remain on `ui/Lottie.jsx`, currently unused
by any caller):**

- **Approach loading** — fetch the player + JSON chunks only when the row
  comes within 400 px of the viewport (one-shot IntersectionObserver,
  `approachMargin="400px"`); nothing requested at initial page load. Under
  reduced motion the chunks still load on approach (the settled final frame
  needs the data).
- **Play-once on entry, replay on re-entry** (`replayOnReenter`) — scroll
  acts as navigation in the prototype, so every fresh entry into the
  viewport restarts the timeline from frame 0; while the row stays in view
  the animation holds its settled final frame (no loop, no ghost replays).
- `prefers-reduced-motion` → static settled frame (`goToAndStop`).
- Slot: `aspect-[692/384] lg:w-[692px]` + the same `drop-shadow` class the
  PNG carries — geometry identical, no layout shift (the explicit `lg:w`
  matters: the media grid item is shrink-to-fit via `lg:justify-self-end`,
  and an empty aspect-ratio box contributes zero intrinsic width until the
  chunks arrive — same reason the ResourceSlider slot pins `lg:w-[665px]`).
  The reverted `<img>` keeps the exact raster box via `maxWidth: 692`, so
  swapping back never moves the row.
- **Bitmap intake convention (LottieLab/Figma exports)**: exports may
  reference their embedded bitmaps as external `/i/<hash>.png` paths (rec-1
  does; the five earlier handoffs were pure vector). The revert removed the
  in-memory prefix remap together with the row's Lottie code — at re-wire
  time, bring back a `remapLottieAssets`-style helper (rewrite `asset.u` to
  `BASE_URL + 'i/'`, JSON file stays verbatim) and ship the bitmaps from
  `www/public/i/<hash>.png`.
- **Pending handoff — embedded bitmap**: the export is not self-contained.
  Its single image asset (`a7d3af06cd64ee430b9222dfed326c9e8adf9a7e`,
  source 1850×853, `u:"/i/"`, `e:0` — the exporter's preview-server path)
  is referenced externally; until the bitmap arrives the three screenshot
  crops (sidebar, browser bar, map area) render empty — no crash, player
  intact. **Ask:** deliver `a7d3af06cd64ee430b9222dfed326c9e8adf9a7e.png`
  (1850×853) and drop it at `www/public/i/` — or issue a re-export with
  assets embedded (no code change needed either way beyond the re-wire
  above).

### Feature 2 — "Mini-mapas por publicação" (row media, "Feature Media" `133:1611`)

**Lottie oficial integrado (2026-09-18).** Delivered by the designer as
`rec-2.json`, copied verbatim to
`src/assets/animations/feature-minimapa.json` (comp "Feature Media",
**665×418 @ 60 fps, `ip=0 op=360` → 6 s**; 1 root precomp layer + 8 assets).

**Loop × play-once (keyframe method):** the four image layers bake opacity
**0→100 over the full 360 frames**; the two "assistant" precomps zoom
**120→100 / 115→100** and drift **70–90 px one-way** across the whole clip;
the "you" marker enters 0→100 by t=112. Everything ends displaced from t0 →
**play-once + hold**, replayed on every fresh viewport entry
(`replayOnReenter`). Measured in the browser (lottie instance probe):
re-entry → first advance 167 ms → settles frame 359/360 paused ≈ 6 s.

**External bitmaps (PROVISIONAL fabrications):** the export references three
bitmaps as `/i/<hash>.png` that were never delivered. Fabricated by cropping
`figma-ref/desktop-v3.png` at the node bounds (x=160, y=3043 — Features
y=2016 + row 927 + media y=100; 665×418) with aspect/dimensions adjusted to
each asset's declared size, shipped at `www/public/i/`:

| Hash | Declared | Content |
|---|---|---|
| `b811828b21ec187a00f45c0b63cd3539e58346ec` | 830×563 | browser chrome + AI-Assisted Map panel (content rows 0–303; bottom band empty by design) |
| `536154ecf2ee77dc9e7deeea8e7873f6b667501a` | 264×594 | AI Assistant chat column |
| `10c3ea5ba8cec875f0a951f57aa10443d5b69ace` | 830×482 | generated minimap w/ satellite photo (the `Rectangle 375` strip region) |

Validation: all three fetch 200 via `/novo/i/…` (remapLottieAssets), PIL
histograms non-empty (17 005 / 1 474 / 939 colors), settled frame visually
carries all three regions. **Awaiting designer masters — swap in place.**

**Reduced motion:** the export's own final frame does **not** match the
static PNG (entrances end displaced), so `prefers-reduced-motion` renders
the original `v3-feature-2.png` as `<img>` and the player/JSON chunks are
never fetched (`LottieFeature` short-circuits before `ui/Lottie.jsx`).

**Desktop width pin:** the Lottie container carries `lg:w-[665px]`
(`mediaLg` in `FEATURES`) — an empty aspect-ratio box contributes zero
intrinsic width in the shrink-to-fit `lg:justify-self-end` rows; without
the pin the F5 row collapsed to 0×0 (caught in verification, fixed
2026-09-18).

### Feature 3 — "Recomendações por tema e território" (row media, Group 16 `133:1642`)

**Reconstruída via código a partir do protótipo (2026-09-18).** O arquivo
Figma é 100 % estático neste node (sem vídeo/shader/reactions legíveis), mas o
protótipo **anima** — a observação ao vivo (método abaixo) capturou um **loop
autônomo de stagger**: a mídia corta a seco para o estado vazio, o pill
"pinhead:tree-stump" volta sozinho e os quatro cards de recomendação
entraram em fade sequencial. A landing reproduz o stagger **uma vez por
entrada na viewport** (convenção F1, decisão do humano) em vez de loopen.

**Inventário de itens** (`get_metadata` depth 4 + `get_design_context`,
coords no espaço do node 601×400; alinhamento PNG↔Figma verificado ≤ 3 px):

| Item | Node | O que é | Box (x,y w×h) | Aparência |
|---|---|---|---|---|
| pill | `133:1644` | frame "pinhead:tree-stump" + Vector `133:1645` | (32,33) 244×96 | branco r24 + ícone verde `#00A67E` 48×41 centralizado |
| card1 | Group 15 `133:1664` | chip + 3 skeleton lines + ícone | (32,147) 221×44 | chip branco r8 39×44 + linhas brancas r2 (174/137/99×8) + ícone cinza `#87898C` 24×20 |
| card2 | Group 14 `133:1658` | idem | (32,207) 221×44 | linhas 174/174/125 |
| card3 | Group 13 `133:1652` | idem | (32,267) 221×44 | linhas 147/174/125 |
| card4 | Group 12 `133:1646` | idem | (32,327) 243×44 | linhas 196/166/137 (card ~22 px mais largo) |

**Observação do protótipo** (2026-09-18, proto `node-id=133-1531`,
1920×914 dpr1, card ancorado pelo verde exato do ícone): os screenshots em
série falham por latência de round-trip (~12-18 s) e o vídeo MediaRecorder
decodificado por seeks é não-confiável (webm sem CUES → seeks colam no mesmo
keyframe). O método que funcionou: **amostragem LIVE** — `canvas.captureStream(60)`
do canvas do player → `<video>` → `requestVideoFrameCallback`, métricas
calculadas por frame apresentado (fração de brancos > 238 por região,
centroide, primeira/última linha branca, verde exato do ícone). O canvas só
repinta quando muda → frames são escassos e event-based (a ordem fica
inequívoca; os timestamps vêm do `mediaTime` do stream). Três ciclos
completos medidos:

| Evento | ciclo 1 | ciclo 2 | ciclo 3 | modelo |
|---|---|---|---|---|
| corte a seco (tudo some) | 2.570 s | 6.548 s | 10.627 s | T0, período ≈ **4.0 s** |
| pill de volta | +120 ms | +217 ms | +139 ms | **T0+0.12–0.22** |
| card1 inicia | +486 ms (94 %) | +453 ms (8 ‰) | +292 ms (1 ‰) | **T0+0.45** |
| card2 (quase junto c/ c1) | — | +453 ms | +292 ms | **T0+0.55** |
| card3 | +714 ms | +781 ms | +683 ms | **T0+0.72** |
| card4 | +900 ms | +781 ms | +683 ms | **T0+0.84** |
| assentado | +900 ms | +956 ms | +858 ms | hold ~3.1 s |

Formato do efeito: **fade puro** — centroide e bounds de linha estáveis
(±1–3 px) em todos os frames de transição, sem assinatura de slide/pop/scale.
O corte de saída é instantâneo (sub-frame); as entradas têm perfil fast-start
(consistente com o bezier `(0.33,1)/(0.68,1)` do export da F1). Nota de
fidelidade: o proto **loopeia enquanto apresentado** (não há reset por
scroll — a "entrada pós-re-entrada" capturada numa passada anterior era fase
do loop); o replay-por-entrada da landing é decisão de design (padrão F1),
documentado aqui como divergência intencional.

**Implementação** (`RecommendationsMedia` + `REC_ITEMS` em
`FeaturesShowcase.jsx`):

- **Fundo**: `v3-feature-3-bg.png` — o PNG original menos as 5 regiões dos
  itens, inpaintadas por difusão harmônica pura-PIL (receita da F1: máscara =
  bbox + 5 px, halo 10 px, 900 iterações de Jacobi, grão gaussiano
  0.4×σ do anel). Validação por região: std interna 2.8–9.2 vs anel
  8.1–29.8, **zero pixels brancos > 238 e zero verdes exatos residuais** nas
  cinco regiões.
- **Itens**: crops retangulares diretos do PNG original
  (`v3-feature-3-{pill,card1..4}.png`, opacos — carregam os pixels do mapa
  entre as formas brancas). Escolha documentada: os paths dos ícones não são
  expostos pela API desktop do Figma e o crop garante assentamento
  pixel-idêntico; verificação composta em canvas (bg + crops nas boxes
  exatas, coordenadas inteiras): **0 pixels mudados** dentro de todas as
  regiões de item e no controle do mapa — os únicos px divergentes (6 % da
  área, MAD 0.42) são os anéis de halo de 5 px ao redor dos itens, cobertos
  pelos crops no estado assentado.
- **Animação**: Framer Motion, fades com stagger — delays 0.12 (pill) /
  0.45 / 0.58 / 0.72 / 0.86 (cards), durações 0.25/0.28 s, ease
  `(0.33,1)/(0.68,1)`; boxes posicionadas em % do box 601×400 (escala
  fluida). Play-once por entrada (`useInView amount 0.25`) + replay por
  re-entrada; `prefers-reduced-motion` **e erro de load do bg** caem no PNG
  original intacto.
- **Verificação** (chrome-devtools, dev server): onsets medidos por série
  rAF de opacidade DOM — pill +107 ms, card1 +407, card2 +505, card3 ~+690,
  card4 +803 do remount (delays programados ± 20 ms); assentamento exato nas
  boxes do Figma (delta 0.0/0.0 nos 5 itens, wrapper 601×400 @1920; escala
  0.5691 @390 com itens a ≤ 0.1 px do esperado×escala); reduced-motion →
  PNG original sem overlay; replay por re-entrada confirmado; console limpo.
  Custo no main bundle: **+4.97 kB raw / +3.15 kB gzip** (pill 2.5 kB inlined
  como data-URL + componente; crops ≥ 5 kB seguem como assets próprios).

### Feature 4 — "Histórias perto de mim" (row media, Group 11 `133:1671`)

**Lottie oficial integrado (2026-09-18) — substitui a reconstrução via código
(documentada abaixo, removida).** Delivered as `rec-4.json`, copied verbatim
to `src/assets/animations/feature-historias.json` (comp "Frame 11",
**600×400 @ 60 fps, 4 s**). The code composition (`StoriesMedia` +
`v3-feature-4-bg.png` + `v3-feature-4-icon.png`) was **deleted**; the
original `v3-feature-4.png` stays as the reduced-motion static.

**Loop × play-once (keyframe method):** the 5 newspaper glyphs and 5 pins
scale **0→100** in staggered entrances (onsets t=0–57, settle by t≈180); the
connector "linha" tracks drift one-way (Δ8.4–16.8 px over 240 frames). Ends
displaced → **play-once + hold** + `replayOnReenter`. Measured: lazy load
(not in the registry before approach), first advance 766 ms from entry
(incl. chunk fetch), settles 239/240 paused.

**External bitmap (PROVISIONAL):** `e734b5bda10306c970458b732191e48362500173`
(792×688 — the Amapá map photo), fabricated from `figma-ref/desktop-v3.png`
at the node bounds (x=160, y=4261 = 2016+2145+100; 600×400), shipped at
`www/public/i/`, fetched 200 via `/novo/i/…`, visibly rendered. **Awaiting
designer master.**

Historical record — the removed code reconstruction (kept for the proto
evidence): o inventário
leu um **SHADER fill (mesh gradient, opacity 0.2, blend COLOR_DODGE)** nesse
node — a observação ao vivo mostrou que ele é **estático**: a luminância de um
patch puro do mapa ficou constante a 0.01/255 por 17.5 s, e o efeito líquido
sobre o mapa é +0.6/255 vs o PNG estático (o export já o carrega). Sem
movimento a reproduzir → **documentado e ignorado** (a missão autorizava
exatamente isso).

**O que anima no protótipo** (live sampling, viewport 1806×870, mapeamento
1:1 com o frame): **apenas o glifo de jornal da noticia grande** pulsa —
mint brilhante (~3.0 s) → fade rápido → glifo ausente (~0.95 s) → fade rápido
de volta, **período ~4.0 s**, loop autônomo (fase contínua, ignorando saídas
da viewport; sem entrada — a mídia chega formada). Capturas intermediárias
mostram blends mint-sobre-mapa ≈ `#07B08A` no trânsito → o corte é um fade
rápido (≤0.1 s), não um hard cut. A linha conectora, o pin e as quatro
noticias pequenas **nunca mudam** (linha: verde-petró escuro constante no
proto — o proto renderiza a linha ~mais escura que o stroke `#00DBA6` do
arquivo; mantemos as cores do PNG, base canônica). Uma passada anterior
flagrou um beat raro com a noticia inteira ausente — variação de cena da
timeline mestre do vídeo; o pulso do glifo é o comportamento dominante e o
que a landing reproduz.

**Implementação** (`StoriesMedia` em `FeaturesShowcase.jsx`): fundo
`v3-feature-4-bg.png` (PNG original menos o bbox do glifo (272,117)-(328,173),
inpaintado por difusão harmônica pura-PIL — receita F1/F3; validação:
std interna 1.9-3.2 vs anel 4.3-7.4, zero px verdes residuais) + o glifo como
crop direto (`v3-feature-4-icon.png`). O blink é reproduzido **uma vez por
entrada na viewport** (convenção F1): hold 0.5 s → fade out 0.13 s → ausente
0.9 s → fade in 0.12 s → assenta no estado estático (as fases 3.0/0.95 s do
loop comprimidas para o evento, mesmo trimming de "metade de entrada" da F3).
Composição assentada: **0 px mudados** na região do glifo; console limpo.

**Verificação** (dev server): onsets medidos por série rAF de opacidade —
fade-out inicia +6 ms do programado (514 vs 507.5), oculto −16 ms (614 vs
630), fade-in +8 ms (1530 vs 1522.5), restaurado −15 ms (1613 vs 1627.5);
assentamento exato (delta 0.00/0.00 na box 56×56 @desktop; @390 escala
0.5517 com delta ≤0.01 px); reduced-motion → PNG original sem overlay; replay
por re-entrada confirmado; sem overflow a 390.

### Feature 5 — "Contexto adicional por IA" (row media, instance `133:1737`)

**Lottie oficial integrado (2026-09-18) — substitui a reconstrução via código
(documentada abaixo, removida).** Delivered as `rec-5.json`, copied verbatim
to `src/assets/animations/feature-contexto.json` (comp "contexto adicional",
**601×400 @ 60 fps, 4 s**, **self-contained** — no external bitmaps). The
code composition (`ContextMedia` + `v3-feature-5-bg.png` +
`v3-feature-5-icons.png` + `v3-feature-5-post.png`) was **deleted**; the
original `v3-feature-5.png` (the canonical 601×400 crop) stays as the
reduced-motion static.

**Loop × play-once (keyframe method):** the 7 post rectangles drift one-way
(Δ40 px over 240 frames); the `memory` precomp fades **0→100 (t≈61) → 100
(t≈225) → 0 (t=240)** while its Newsmode icons grow 100→130 — the panel is a
*transient* that resolves into the post. End state ≠ start state →
**play-once + hold** + `replayOnReenter`. Consequence, verified in the
browser: the export's **final frame carries no memory icons** (they fade out
by design), so reduced-motion shows the original PNG instead of the settled
frame. Measured: first advance 186 ms from entry, settles 239/240 paused;
mid-flight frame 111 shows the 10 icons at opacity 1 (DOM probe + paused
screenshot).

**Desktop width pin:** F5 is a `mediaRight` row (shrink-to-fit wrapper) and
collapsed to 0×0 before the JSON arrived — fixed with `lg:w-[601px]` on the
Lottie container (the F2/F4 rows stretch and were unaffected; all three now
carry the pin).

Historical record — the removed code reconstruction (kept for the proto
evidence): o SHADER do
node (noise texture, opacity 0.1, NORMAL) mediu **estático e invisível**
(luminância do card constante; sem drift) → documentado e ignorado.

**Observação** (live sampling): loop autônomo de **~4.0 s** — (T0) os dez
ícones "Newsmode" do painel de memória **hard-cut IN juntos** (sem stagger
mensurável a 36 ms) e os 7 retângulos do post saltam ao contraste máximo;
(T0+2.0 s) os ícones **hard-cut OUT** e os retângulos decaem — queda rápida
para ~85 % e fade lento até ~68 % da escuridão ao longo de ~1 s — enquanto o
painel de memória escurece ~4 % de luminância (sub-limiar, não reproduzido);
(T0+4.0 s) repete. Sem entrada; fase contínua. Sem_motion nos ícones além da
opacidade (um sub-glyph de 2 ícones varia ~10 % — detalhe sub-perceptível,
documentado, não reproduzido).

**Bug de asset corrigido**: o `v3-feature-5.png` anterior era um export
1266×864 (aspecto 1.465) espremido numa caixa 601×400 — distorção sutil. O
asset foi **regenerado como o crop exato 601×400** do render do design em
`figma-ref/desktop-v3.png` (1159,4861) — paleta idêntica, geometria canônica;
é também o fallback de reduced-motion.

**Implementação** (`ContextMedia` em `FeaturesShowcase.jsx`): fundo
`v3-feature-5-bg.png` (crop canônico menos a região dos ícones (44,52)-(156,351)
e o grupo post (251,84)-(493,315), inpaintadas — fills planos, validação std
0.0) + `v3-feature-5-icons.png` (os 10 ícones como um único crop — movem-se
juntos) + `v3-feature-5-post.png`. Um ciclo por entrada: hold 0.5 s → cut-out
dos ícones (fade 0.07 s) com o post decaindo 1 → 0.72 (rápido) → 0.6 (lento,
~0.4 s) → hold 1.1 s → cut-in + post de volta a 1 → assenta no estático.
Os hard cuts do proto são modelados como fades ≤0.1 s (adaptação documentada;
os cortes do proto são <36 ms). Composição assentada: **0 px mudados** nas
regiões dos itens.

**Verificação**: onsets — cut-out 521 ms (prog 507.5), ícones a zero 572
(prog 577.5), post 0.65 @810 (curva programada), restauração 1554-1603 (prog
1540-1610); assentamento delta 0.00 nos dois itens; reduced-motion → PNG
estático; replay por re-entrada; sem overflow a 390.

### Media inventory (Figma read 2026-09-17, `get_design_context` depth ≤2; row 3 re-read 2026-09-18)

| Row | Figma node | Declared name | Dims | Media fill (as declared) | Animated in design? | Status |
|---|---|---|---|---|---|---|
| 1 Geolocalização | `133:1593` | Group 17 | 692×384 | SOLID white card (r16 + drop shadow) + 2 IMAGE fills + pin vectors | not in file — motion exists only as the official Lottie handoff | **reconstruída via código** — pins SVG + fundo inpaintado (`v3-feature-1-bg.png`); re-wire Lottie opcional |
| 2 Minimapa | `133:1611` | Feature Media | 665×418 | SOLID + IMAGE + **VIDEO** — "Rectangle 375" `133:1630`, 414×118 strip at (36,299), videoHash `cd55c854…`, opacity 0.6 + luminosity overlay | **yes** — partial-area video (minimap interaction; burst-then-quiet cadence observed in the proto) | **Lottie oficial integrado (rec-2, 2026-09-18)** — play-once + replay-on-reentry; 3 bitmaps fabricados **provisórios** (`public/i/`), masters pendentes |
| 3 Recomendações | `133:1642` | Group 16 | 601×400 | IMAGE (map card, imageHash `87ef053b…`) + white solids/vectors (pill "pinhead:tree-stump" + 4 recommendation cards) | file static — **yes in proto** (looping stagger observed 2026-09-18, see F3 section above) | **reconstruída via código** — crops dos itens + fundo inpaintado (`v3-feature-3-bg.png`), stagger fades; Lottie substituível quando chegar |
| 4 Histórias | `133:1671` | Group 11 | 600×400 | IMAGE + **SHADER** fill (opacity 0.2, blend COLOR_DODGE, id `3f03519c…/428`) over the map + 5 "noticia" groups | shader measured **static** (+0.6/255); **yes in proto** — the big noticia's glyph blinks (observed 2026-09-18, see F4 section above) | **Lottie oficial integrado (rec-4, 2026-09-18)** — play-once + replay-on-reentry; 1 bitmap fabricado **provisório** (`e734b5bd…`), master pendente; reconstrução via código removida |
| 5 Contexto | `133:1737` | contexto adicional (INSTANCE, main component `9:1115`) | 601×400 | SOLID mint + hidden IMAGE + **SHADER** (opacity 0.1, id `958fe881…/431`) + "memory"/"post" groups | shader static/invisible; **yes in proto** — memory icons blink + post decays (observed 2026-09-18, see F5 section above) | **Lottie oficial integrado (rec-5, 2026-09-18)** — autocontido; play-once + replay-on-reentry; frame final sem os ícones (transiente) → reduced-motion mostra o PNG original |

No node exposes prototype reactions or variant sets through the desktop API
(F5 `componentProperties` reads empty); the VIDEO/SHADER fills above are the
only machine-readable animation signals in the 15/9 delivery. Note: the doc
previously recorded the F2 video as node `133:1613` ("print-animado 1") — in
the current file that rect is a plain SOLID and the video lives in
`133:1630`; the file has evidently been touched since the proto observation.

### Export spec for the remaining pending medias (request to the designer)

**2026-09-18 (second update) — rec-2, rec-4 and rec-5 were DELIVERED and are
integrated** (F2/F4/F5 run the official exports — see their sections above).
What remains open:

1. **Masters of the fabricated bitmaps** (all PROVISIONAL, cropped from the
   design render — swap in place at `www/public/i/`, the hashes in the JSONs
   stay and no code change is needed):
   - F2 `feature-minimapa.json`: `b811828b…` (830×563), `536154ec…` (264×594),
     `10c3ea5b…` (830×482)
   - F4 `feature-historias.json`: `e734b5bd…` (792×688)
   - Slider tab 2 `layers.json`: **DELIVERED 2026-09-21** (`layer-1..4.png`)
     and integrated — see "Tab 2 official photo masters (2026-09-21)" below.
2. **F1 `feature-geolocalizacao.json` bitmap** `a7d3af06…` (1850×853) — the
   code reconstruction already ships the motion, so this only unblocks the
   OPTIONAL full-Lottie re-wire.
3. **F3 `feature-recomendacoes.json`** — optional polish only; the code
   reconstruction reproduces the measured proto stagger.

Same format as the previous handoffs (`find-location.json`,
`localisation.json`, …): **Lottie JSON, 60 fps, comp sized exactly to the
node box**, exported from the AE comp reproducing the node. Delivery naming
`rec-N.json` (designer numbering); renamed on intake:

| Row | Ask | Node / name | Comp dims | Notes for the designer |
|---|---|---|---|---|
| 2 Minimapa | ~~Lottie JSON~~ **entregue (rec-2)** — só os masters dos 3 bitmaps | `133:1611` "Feature Media" | 665×418 | the integrated export plays the assistant-led minimap generation; verify the fabricated bitmaps against the AE comp |
| 3 Recomendações | Lottie JSON | `133:1642` "Group 16" | 601×400 | file is static but the **proto loops a stagger** (pill → cards, ~4 s cycle, hard cut out + fades in — measured 2026-09-18); the code reconstruction already reproduces it, so this export is now **optional polish** — if delivered, match the measured rhythm (onsets ≈ 0.15/0.45/0.55/0.72/0.85 s after the cut) |
| 4 Histórias | ~~Lottie JSON~~ **entregue (rec-4)** — só o master do bitmap `e734b5bd…` | `133:1671` "Group 11" | 600×400 | — |
| 5 Contexto | ~~Lottie JSON~~ **entregue (rec-5)**, autocontido | `133:1737` "contexto adicional" (main `9:1115`) | 601×400 | — |

Intake filenames: `feature-minimapa.json` / `feature-historias.json` /
`feature-contexto.json` are **taken** (rec-2/4/5 live);
`feature-recomendacoes.json` stays reserved for the optional F3 export. The
three integrated rows share the same slot contract
(`approachMargin="400px"` + `replayOnReenter` + reduced-motion → original
PNG, `LottieFeature` in `FeaturesShowcase.jsx`), with the row geometry
pinned by each node's intrinsic size (`mediaLg` desktop width pin).

## How It Works (133:1738 / Steps Row 133:1742)

| Element | Expected | Implemented | Status |
|---|---|---|---|
| Step cards | **static** in steady state (1.3 s interval diff: IDENTICAL); entrance not observable post-load (Figma delay-based triggers already played) | Reveal fade+rise with 0.1 s sequential delays (HowItWorks.jsx:66) | ok |

## Live Demo (133:1758)

| Element | Expected | Implemented | Status |
|---|---|---|---|
| Print media | video fill `print-animado 1` (133:1766), loops | `print-animado.mp4` autoplay muted loop, poster under reduced-motion (LiveDemo.jsx:95–109) | **ok** |
| Mockup hover | untested | scale 1.01 / y −4 spring (LiveDemo.jsx:62) | ok (incerto) |
| CTA hover (133:1775) | **whole-surface fill change, no scale** (67 % of button px changed; center darkens to ≈#019775, edges lighten ≈#39aa90 — measured via dispatched mouseover) | `hover:brightness-110` (brightens — wrong direction) | **gap** → darkened hover this slice |

## Workshops (133:1776) / Footer (133:1801)

| Element | Expected | Implemented | Status |
|---|---|---|---|
| — | no animation evidence in file or proto (plain frames, no video nodes, no observable motion) | Reveal entrances + CSS hovers only | ok |

## Header (133:1532)

Not animatable in the proto evidence (static in every hero-fold capture).
Implemented: underline grow, mobile menu height animation, language dropdown —
all additive/ok.

## Interpretation notes (fidelity)

- ~~The implemented hero cycle uses a **8.4 s master timeline**…~~ **Removed
  with the manual recreation** — the official Lottie export is the single
  source of truth for hero-fold motion now; nothing is hand-recreated.
- Reduced motion disables every added animation; the Lottie degrades to its
  final settled frame (`goToAndStop(totalFrames-1)`), text entrances keep
  opacity-only fades.
