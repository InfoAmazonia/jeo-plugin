import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import Reveal from './ui/Reveal.jsx'
import Lottie from './ui/Lottie.jsx'
import { useI18n } from '../i18n/index.jsx'
import mediaGeolocation from '../assets/v3-feature-1.png'
import mediaGeolocationBg from '../assets/v3-feature-1-bg.png'
import mediaMinimaps from '../assets/v3-feature-2.png'
import mediaRecommendations from '../assets/v3-feature-3.png'
import mediaRecommendationsBg from '../assets/v3-feature-3-bg.png'
import mediaRecommendationsPill from '../assets/v3-feature-3-pill.png'
import mediaRecommendationsCard1 from '../assets/v3-feature-3-card1.png'
import mediaRecommendationsCard2 from '../assets/v3-feature-3-card2.png'
import mediaRecommendationsCard3 from '../assets/v3-feature-3-card3.png'
import mediaRecommendationsCard4 from '../assets/v3-feature-3-card4.png'
import mediaStories from '../assets/v3-feature-4.png'
import mediaContext from '../assets/v3-feature-5.png'

// Official Lottie exports (designer rec-2/rec-4/rec-5, 2026-09-18) — loaded
// through dynamic import() so each JSON stays in its own async chunk, fetched
// only when the row approaches the viewport (Lottie approachMargin).
const loadMinimaps = () => import('../assets/animations/feature-minimapa.json')
const loadStories = () => import('../assets/animations/feature-historias.json')
const loadContext = () => import('../assets/animations/feature-contexto.json')

/**
 * Features Showcase (redesign v3) — Figma frame "Features Showcase" (133:1584).
 *
 * Layout mirrors the Figma row by row: header band + five alternating
 * text × media rows (media right / left / right / left / right) with
 * alternating light backgrounds.
 *
 * Notes:
 * - Figma titles render UPPERCASE (verified against the design render);
 *   copy is stored as typed and uppercased via the `uppercase` class,
 *   same convention as the ResourceSlider.
 * - Alternating backgrounds (Figma fills): rows 1/3/5 mint (#E8F0E8 =
 *   v3-mint), rows 2/4 + header light (#FAFAF8 = v3-light). Row 1 also
 *   carries a vertical #FAFAF8 → transparent gradient over the first 50%
 *   of its height, smoothing the light → mint transition.
 * - Media: opaque PNGs with the row background baked at the edges; the
 *   Figma drop shadow (r16, #0A1628 @ 16%) is applied via CSS so the media
 *   edge reads as a card. Feature 1 is a code reconstruction of its Lottie
 *   score (see GEO_PINS below + figma-ref/redesign-v3-animations.md): the
 *   official export's only bitmap was never delivered, so the three vector
 *   pins were re-coded as inline SVG over an inpainted background. Feature 3
 *   is a code reconstruction of its prototype cycle (see REC_ITEMS below +
 *   the same doc): the Figma file is static, but the prototype loops a
 *   staggered fade of the recommendation items — pill first, then the four
 *   cards — reproduced here as cropped item images over an inpainted
 *   background. The full Lottie re-wire stays optional for when the
 *   bitmaps land.
 * - Mobile order: media first, text below, for every row (rows where the
 *   media sits left on desktop keep DOM order; text-first rows flip via
 *   `order-2 lg:order-none`).
 * - Vertical rhythm: every band (header + rows) carries the shared
 *   `section-pad-v3` base (48px on mobile, so the pale-on-pale exit into
 *   HowItWorks reads as the same 96px boundary as every other section);
 *   sm:/lg: keep the Figma paddings (80/100px) — see index.css.
 * - Motion: each block enters through `Reveal` (reduced-motion aware).
 */

// Intrinsic media sizes and per-row chrome, in Figma order. `load` rows play
// the official Lottie export (see LottieFeature); the PNG `media` remains the
// reduced-motion static.
const FEATURES = [
  {
    key: 'geolocation',
    media: mediaGeolocation,
    width: 692,
    height: 384,
    mediaRight: true,
    bg: 'bg-v3-mint bg-[linear-gradient(to_bottom,#FAFAF8_0%,rgba(250,250,248,0)_50%)]',
  },
  {
    key: 'minimaps',
    media: mediaMinimaps,
    load: loadMinimaps,
    loop: false,
    width: 665,
    height: 418,
    mediaLg: 'lg:w-[665px]',
    mediaRight: false,
    bg: 'bg-v3-light',
  },
  {
    key: 'recommendations',
    media: mediaRecommendations,
    width: 601,
    height: 400,
    mediaRight: true,
    bg: 'bg-v3-mint',
  },
  {
    key: 'stories',
    media: mediaStories,
    load: loadStories,
    loop: false,
    width: 600,
    height: 400,
    mediaLg: 'lg:w-[600px]',
    mediaRight: false,
    bg: 'bg-v3-light',
  },
  {
    key: 'context',
    media: mediaContext,
    load: loadContext,
    loop: false,
    width: 601,
    height: 400,
    mediaLg: 'lg:w-[601px]',
    mediaRight: true,
    bg: 'bg-v3-mint',
  },
]

/**
 * Feature 1 pin drop — reconstructed by code from the official Lottie score
 * (`src/assets/animations/feature-geolocalizacao.json`, comp "Frame 17",
 * 692×384 @ 60 fps, ip=0 op=240), whose only bitmap asset was never
 * delivered. Everything below is read from that JSON:
 *
 * - Shapes: the "Location pin" precomps share one 28×40 vector (anchor
 *   (14,20)) with an even-odd inner dot — beziers copied from the `sh`
 *   properties, colors from the layer fills (#5B5F62 gray ×2, #00A67E the
 *   highlighted one).
 * - Position: the y keyframes are baked per frame in the export (easing
 *   burned into 60 fps samples), so each `y` array IS the keyframe series —
 *   evenly spaced, played back with linear interpolation. All three pins
 *   share the same normalized curve: fast fall, ~9.8% overshoot, settle
 *   (travel +72/+72/+188 px). `delay`/`yDur` are frame times / 60.
 * - Opacity: 0→100 entrances; the green pin's track is not baked and
 *   discloses the designer easing (0.33,1)/(0.68,1), which the baked gray
 *   ramps match — modeled with that single cubic-bezier.
 *
 * Full keyframe table and provenance: figma-ref/redesign-v3-animations.md.
 */
const PIN_BODY_D =
  'M14 0C6.26 0 0 6.26 0 14c0 3.48 1 6.74 2.82 9.68 1.9 3.08 4.4 5.72 6.32 8.8.94 1.5 1.62 2.9 2.34 4.52.52 1.1.94 3 2.52 3s2-1.9 2.5-3c.74-1.62 1.4-3.02 2.34-4.52 1.92-3.06 4.42-5.7 6.32-8.8C28 20.74 28 17.48 28 14 28 6.26 21.74 0 14 0Z'
const PIN_DOT_D =
  'M14 19.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z'

const PIN_OPACITY_EASE = [0.33, 1, 0.68, 1]

const GEO_PINS = [
  {
    key: 'pin-green',
    color: '#00A67E',
    x: 401,
    delay: 0,
    yDur: 0.5, // frames 0→30
    opDur: 0.1, // frames 0→6
    y: [22.61, 50.2, 75.5, 98.55, 119.4, 138.12, 154.78, 169.45, 182.23, 193.19, 202.45, 210.11, 216.28, 221.08, 224.63, 227.04, 228.45, 228.98, 228.77, 227.92, 226.58, 224.86, 222.87, 220.75, 218.6, 216.51, 214.61, 212.98, 211.72, 210.9, 210.61],
  },
  {
    key: 'pin-gray-left',
    color: '#5B5F62',
    x: 324,
    delay: 0.583, // frame 35
    yDur: 0.517, // frames 35→66
    opDur: 0.483, // frames 36→65
    y: [13.61, 14.27, 24.78, 34.42, 43.2, 51.13, 58.25, 64.59, 70.16, 75.01, 79.17, 82.68, 85.58, 87.91, 89.71, 91.05, 91.95, 92.46, 92.65, 92.55, 92.21, 91.69, 91.02, 90.26, 89.44, 88.62, 87.83, 87.1, 86.48, 86.01, 85.71, 85.61],
  },
  {
    key: 'pin-gray-right',
    color: '#5B5F62',
    x: 578,
    delay: 0.85, // frame 51
    yDur: 0.5, // frames 51→81
    opDur: 0.467, // frames 52→80
    y: [3.61, 14.18, 23.87, 32.69, 40.68, 47.85, 54.23, 59.85, 64.74, 68.94, 72.49, 75.42, 77.78, 79.62, 80.98, 81.9, 82.44, 82.65, 82.56, 82.24, 81.73, 81.07, 80.31, 79.49, 78.67, 77.87, 77.14, 76.52, 76.03, 75.72, 75.61],
  },
]

function GeolocationPin({ pin, play }) {
  return (
    // Static x offset + anchor correction: the pin's (14,20) reference point
    // sits at (pin.x, 0) of the comp, so animated y values are comp-space.
    <g transform={`translate(${pin.x - 14} -20)`}>
      <motion.g
        key={play}
        initial={{ y: pin.y[0], opacity: 0 }}
        animate={{ y: pin.y, opacity: 1 }}
        transition={{
          y: { duration: pin.yDur, delay: pin.delay, ease: 'linear' },
          opacity: {
            duration: pin.opDur,
            delay: pin.delay,
            ease: PIN_OPACITY_EASE,
          },
        }}
      >
        <path
          d={`${PIN_BODY_D} ${PIN_DOT_D}`}
          fill={pin.color}
          fillRule="evenodd"
        />
      </motion.g>
    </g>
  )
}

/**
 * Feature 1 media: inpainted background (`v3-feature-1-bg.png`, the static
 * PNG minus the three baked pins) + the SVG pins above, replaying the drop
 * on every fresh entry into the viewport (same narrative-scroll behavior
 * the parked Lottie re-wire specifies). Reduced motion — and any failure to
 * load the inpainted background — falls back to the original static PNG
 * (pins baked in), never a visibly broken card.
 */
function GeolocationMedia({ alt }) {
  const reduce = useReducedMotion()
  const mediaRef = useRef(null)
  const inView = useInView(mediaRef, { amount: 0.25 })
  const [play, setPlay] = useState(0)
  const [bgFailed, setBgFailed] = useState(false)

  useEffect(() => {
    if (inView) setPlay((n) => n + 1)
  }, [inView])

  if (reduce || bgFailed) {
    return (
      <img
        src={mediaGeolocation}
        alt={alt}
        width={692}
        height={384}
        style={{ maxWidth: 692 }}
        className="h-auto w-full drop-shadow-[0_0_16px_rgba(10,22,40,0.16)]"
      />
    )
  }

  return (
    <div ref={mediaRef} className="relative w-full" style={{ maxWidth: 692 }}>
      <img
        src={mediaGeolocationBg}
        alt={alt}
        width={692}
        height={384}
        onError={() => setBgFailed(true)}
        className="h-auto w-full drop-shadow-[0_0_16px_rgba(10,22,40,0.16)]"
      />
      <svg
        viewBox="0 0 692 384"
        aria-hidden="true"
        focusable="false"
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        {GEO_PINS.map((pin) => (
          <GeolocationPin key={pin.key} pin={pin} play={play} />
        ))}
      </svg>
    </div>
  )
}

/**
 * Feature 3 recommendation items — reconstructed by code from the Figma
 * prototype (node `133:1642`, "Group 16", 601×400; media inventory and
 * measurement method in figma-ref/redesign-v3-animations.md).
 *
 * - Geometry: `box` values are the item bboxes in the node's coordinate
 *   space, read from the Figma file (pill = the "pinhead:tree-stump" frame
 *   244×96 at (32,33); cards = Groups 15/14/13/12, 44px tall, stacked every
 *   60px from y=147). Applied as percentages of the 601×400 media box, so
 *   the crops land pixel-aligned at any render width.
 * - Items are straight crops of the original `v3-feature-3.png` (opaque
 *   rectangles that carry the map pixels between the white shapes), animated
 *   over `v3-feature-3-bg.png` — the same PNG with the five item regions
 *   removed by harmonic-diffusion inpainting. The icon vectors are not
 *   exposed by the Figma desktop API, so cropping guarantees the settled
 *   state is pixel-identical to the static PNG.
 * - Timing (observed in the prototype, 3 cycles, live frame sampling): the
 *   card hard-cuts to empty, then items fade back in — pill first (~0.15s
 *   after the cut), cards staggered card1→card4 over ~0.45–0.85s, spreads
 *   ~0.8s, cycle ~4s. No translation or scale was measurable (pure opacity
 *   fade). The landing plays the stagger once per viewport entry (Feature 1
 *   convention) instead of looping.
 */
const REC_ITEM_EASE = [0.33, 1, 0.68, 1] // same designer ease as the F1 pin opacity

const REC_ITEMS = [
  { key: 'pill', src: mediaRecommendationsPill, box: [32, 33, 244, 96], delay: 0.12, dur: 0.25 },
  { key: 'card1', src: mediaRecommendationsCard1, box: [32, 147, 221, 44], delay: 0.45, dur: 0.28 },
  { key: 'card2', src: mediaRecommendationsCard2, box: [32, 207, 221, 44], delay: 0.58, dur: 0.28 },
  { key: 'card3', src: mediaRecommendationsCard3, box: [32, 267, 221, 44], delay: 0.72, dur: 0.28 },
  { key: 'card4', src: mediaRecommendationsCard4, box: [32, 327, 243, 44], delay: 0.86, dur: 0.28 },
]

/**
 * Feature 3 media: inpainted background + the cropped items above, fading
 * in the prototype's stagger on every fresh entry into the viewport (same
 * narrative-scroll contract as GeolocationMedia). Reduced motion — and any
 * failure to load the inpainted background — falls back to the original
 * static PNG (items baked in), never a visibly broken card.
 */
function RecommendationsMedia({ alt }) {
  const reduce = useReducedMotion()
  const mediaRef = useRef(null)
  const inView = useInView(mediaRef, { amount: 0.25 })
  const [play, setPlay] = useState(0)
  const [bgFailed, setBgFailed] = useState(false)

  useEffect(() => {
    if (inView) setPlay((n) => n + 1)
  }, [inView])

  if (reduce || bgFailed) {
    return (
      <img
        src={mediaRecommendations}
        alt={alt}
        width={601}
        height={400}
        style={{ maxWidth: 601 }}
        className="h-auto w-full drop-shadow-[0_0_16px_rgba(10,22,40,0.16)]"
      />
    )
  }

  return (
    <div ref={mediaRef} className="relative w-full" style={{ maxWidth: 601 }}>
      <img
        src={mediaRecommendationsBg}
        alt={alt}
        width={601}
        height={400}
        onError={() => setBgFailed(true)}
        className="h-auto w-full drop-shadow-[0_0_16px_rgba(10,22,40,0.16)]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {REC_ITEMS.map(({ key, src, box, delay, dur }) => (
          <motion.div
            key={`${key}-${play}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: dur, delay, ease: REC_ITEM_EASE }}
            className="absolute"
            style={{
              left: `${(box[0] / 601) * 100}%`,
              top: `${(box[1] / 400) * 100}%`,
              width: `${(box[2] / 601) * 100}%`,
              height: `${(box[3] / 400) * 100}%`,
            }}
          >
            <img src={src} alt="" width={box[2]} height={box[3]} className="h-full w-full" />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/**
 * Feature media driven by the official Lottie exports (F2 minimapa rec-2,
 * F4 histórias rec-4, F5 contexto rec-5 — full provenance in
 * figma-ref/redesign-v3-animations.md). All three exports are entrance
 * compositions that end displaced from their t0 state (F2: image opacities
 * 0→100 with onsets up to t≈180 and scale-assistants zooming 120→100 over
 * the full 6 s; F4/F5: newspapers/pins scale 0→100 staggered, connector
 * lines and rectangles drifting to rest) → play-once + hold, replayed on
 * every fresh viewport entry (scroll acts as navigation, same contract as
 * the F1/F3 code reconstructions).
 *
 * `prefers-reduced-motion` shows the original static PNG (`poster`) instead —
 * the exports' own final frames would not match it (e.g. rec-5 ends with the
 * memory icons faded out), and no player chunk is fetched at all.
 *
 * The three exports reference their photo bitmaps as external
 * `/i/<hash>.png` paths that were never delivered; the current files under
 * `public/i/` are PROVISIONAL fabrications from the design render (masters
 * from the designer pending — swap in place, the hashes in the JSONs stay).
 */
function LottieFeature({ load, loop, title, poster, width, height, mediaLg }) {
  const reduce = useReducedMotion()

  if (reduce) {
    return (
      <img
        src={poster}
        alt={title}
        width={width}
        height={height}
        style={{ maxWidth: width }}
        className="h-auto w-full drop-shadow-[0_0_16px_rgba(10,22,40,0.16)]"
      />
    )
  }

  // mediaLg pins the exact Figma width at lg: on mediaRight rows the Reveal
  // wrapper is shrink-to-fit (`lg:justify-self-end`), and an empty
  // aspect-ratio box contributes zero intrinsic width until the chunks
  // arrive — the same reason the ResourceSlider slot pins `lg:w-[665px]`.
  return (
    <Lottie
      loadAnimationData={load}
      loop={loop}
      title={title}
      approachMargin="400px"
      replayOnReenter
      className={`w-full drop-shadow-[0_0_16px_rgba(10,22,40,0.16)] ${mediaLg}`}
      style={{ aspectRatio: `${width} / ${height}`, maxWidth: width }}
    />
  )
}

function FeatureRow({ feature, copy }) {
  const { media, width, height, mediaRight } = feature

  // Fluid below lg, the exact Figma intrinsic width at lg (maxWidth keeps
  // the raster box).
  const mediaBlock = (
    <Reveal
      delay={0.12}
      className={mediaRight ? 'lg:justify-self-end' : ''}
    >
      {feature.key === 'geolocation' ? (
        <GeolocationMedia alt={copy.alt} />
      ) : feature.key === 'recommendations' ? (
        <RecommendationsMedia alt={copy.alt} />
      ) : (
        <LottieFeature
          load={feature.load}
          loop={feature.loop}
          title={copy.alt}
          poster={media}
          width={width}
          height={height}
          mediaLg={feature.mediaLg}
        />
      )}
    </Reveal>
  )

  const textBlock = (
    /* On mobile every row shows the media first; rows with text on the
       left flip the DOM order back at lg. */
    <Reveal className={mediaRight ? 'order-2 lg:order-none' : ''}>
      <div className="flex flex-col gap-6">
        <h3 className="font-condensed text-3xl font-bold uppercase leading-[1.2] text-v3-navy sm:text-4xl lg:text-[40px]">
          {copy.title}
        </h3>
        <p className="text-lg font-bold leading-[1.5] text-v3-navy sm:text-xl">
          {copy.subtitle}
        </p>
        <p className="text-lg leading-[1.5] text-v3-navy">{copy.body}</p>
      </div>
    </Reveal>
  )

  return (
      <div className={feature.bg}>
      <div className="section-shell-v3 grid items-center gap-10 section-pad-v3 sm:py-16 lg:grid-cols-2 lg:gap-[120px] lg:py-[100px]">
        {mediaRight ? (
          <>
            {textBlock}
            {mediaBlock}
          </>
        ) : (
          <>
            {mediaBlock}
            {textBlock}
          </>
        )}
      </div>
    </div>
  )
}

export default function FeaturesShowcase() {
  const { t } = useI18n()
  const showcase = t.showcase

  return (
    <section
      id="inteligencia-artificial"
      aria-labelledby="features-showcase-title"
      className="relative bg-v3-light"
    >
      {/* Header band (Figma "Pain Points Header" 133:1585) */}
      <div className="section-shell-v3 flex flex-col items-center gap-4 section-pad-v3 sm:py-20 text-center">
        <Reveal>
          <h2
            id="features-showcase-title"
            className="font-condensed text-4xl font-bold uppercase leading-[1.2] text-v3-navy sm:text-5xl lg:text-[64px]"
          >
            {showcase.title}
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="max-w-[1152px] text-lg leading-[1.5] text-v3-gray sm:text-xl">
            {showcase.lead}
          </p>
        </Reveal>
      </div>

      {FEATURES.map((feature) => (
        <FeatureRow
          key={feature.key}
          feature={feature}
          copy={showcase.features[feature.key]}
        />
      ))}
    </section>
  )
}
