import { motion, useReducedMotion } from 'framer-motion'
import { useI18n } from '../i18n/index.jsx'
import { DOWNLOAD_URL, DOCS_URL } from '../links.js'
import infoamazoniaLogo from '../assets/v3-infoamazonia-logo.png'
import heroBackground from '../assets/hero-background.mp4'
import heroPoster from '../assets/hero-poster.jpg'
import Lottie from './ui/Lottie.jsx'

// Dynamic import: the 360 kB animation JSON (+ lottie player) load as async
// chunks, keeping the main bundle lean. The aspect-ratio box below holds the
// geometry while they stream in.
const loadFindLocation = () => import('../assets/animations/find-location.json')

// Waterfall: kick BOTH async chunks at module-evaluation time — right after
// the main bundle parses — instead of waiting for the post-mount effect.
// import() dedupes by module, so the Lottie wrapper's own calls resolve to
// these already-in-flight promises. Saves ~600 ms on the animation onset
// without adding a single byte to the critical path (a hashed <link
// rel="modulepreload"> in index.html would break on every rebuild).
void import('lottie-web/build/player/esm/lottie_svg.min.js')
void loadFindLocation()

export default function Hero() {
  const reduce = useReducedMotion()
  const { t } = useI18n()

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
  }
  const item = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    },
  }

  return (
    <section className="relative isolate overflow-hidden bg-v3-navy-hero">
      {/* Official hero background per the 15/9 Figma delivery (frame
          133:1553), fill stack bottom→top: the official video (opacity 0.8),
          a #0A1628 COLOR-blend solid, a #0A1628 90% solid, and the vertical
          gradient — transparent at the bottom, opaque navy at the top. The
          video is the official asset restored from the V2 site history
          (md5-confirmed byte-identical). All fills are -z-10 inside the
          section's isolated stacking context, so DOM order = paint order and
          the content/Lottie stay above. Under prefers-reduced-motion the
          <video> is not rendered at all: the section navy + the gradient
          (the previous static state) remain — no flash, since the navy is
          the section's own background. */}
      {!reduce && (
        <>
          <video
            src={heroBackground}
            /* First-frame JPG: paints instantly under the overlays while the
               video streams — same frame 0, so the handover is seamless. */
            poster={heroPoster}
            autoPlay
            loop
            muted
            playsInline
            disablePictureInPicture
            disableRemotePlayback
            aria-hidden="true"
            tabIndex={-1}
            /* React sets `muted` as a property, not an attribute — Chrome
               then blocks autoplay. Force it and kick playback manually. */
            ref={(el) => {
              if (el) {
                el.muted = true
                el.play().catch(() => {})
              }
            }}
            className="absolute inset-0 -z-10 h-full w-full object-cover opacity-80"
          />
          {/* Figma fill: #0A1628, blendMode COLOR. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[#0A1628] mix-blend-color"
          />
          {/* Figma fill: #0A1628 at 90%. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[#0A1628]/90"
          />
        </>
      )}
      {/* Figma top fill: vertical gradient (the section's former own
          background, hoisted into the stack). Always rendered — with the
          navy it is the static reduced-motion backdrop. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-transparent to-v3-navy-hero"
      />
      {/* Mobile stacking order (issue #669): eyebrow → H1 → subtitle →
          animation → CTAs. Desktop (lg+) keeps the validated side-by-side
          geometry: text column on the left, illustration on the right. The
          grid is a single motion container so the framer stagger still
          propagates to every variants={item} child (variant inheritance
          flows through plain DOM elements). Three siblings with explicit lg
          placement: text in col 1 row 1, CTAs in col 1 row 2, and the Lottie
          spanning both rows in col 2 — vertically centered against the full
          text+CTAs height, exactly as before. Row gap on lg is 20 (80px),
          matching the former lg:mt-20 between subtitle and CTAs, so desktop
          metrics are unchanged; mobile gap-12 (48px) separates all three.
          lg:content-center keeps the two left rows vertically centered as a
          single block inside min-h-[790px] (align-content would otherwise
          stretch the free space into the rows and push subtitle and CTAs
          apart — a desktop regression). */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="section-shell-v3 grid items-center gap-12 section-pad-v3 sm:py-16 lg:min-h-[790px] lg:grid-cols-[687px_1fr] lg:content-center lg:gap-x-10 lg:gap-y-20 lg:py-20"
      >
        <div className="flex max-w-2xl flex-col items-start lg:col-start-1 lg:row-start-1">
          <motion.p variants={item} className="eyebrow-v3">
            {t.hero.eyebrow}
            <img
              src={infoamazoniaLogo}
              alt="InfoAmazonia"
              className="h-6 w-auto"
            />
          </motion.p>

          <motion.h1
            variants={item}
            className="font-condensed mt-16 text-4xl font-bold uppercase leading-[1.1] text-v3-light sm:text-5xl lg:mt-20 lg:text-[64px]"
          >
            {t.hero.title}
          </motion.h1>

          <motion.p
            variants={item}
            /* Issue #669: mobile H1→subtitle gap is 32px (mt-8). Tablet keeps
               the former 64px and desktop the Figma-validated 80px. */
            className="mt-8 text-lg leading-[1.5] text-v3-mint sm:mt-16 sm:text-xl lg:mt-20 lg:text-2xl"
          >
            {t.hero.subtitle}
          </motion.p>
        </div>

        {/* Official hero-animate instance exported from Figma (793×480, 60fps,
            4s). The JSON settles at the final frame with no return keyframes,
            so it plays once and holds the settled state — the source of truth
            replaces the former manual PNG-layer recreation. Same geometry as
            the old composite: aspect-[793/480] inside max-w-[793px]. */}
        <div className="mx-auto w-full max-w-[793px] lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <Lottie
            loadAnimationData={loadFindLocation}
            loop={false}
            title={t.hero.illustrationAlt}
            className="aspect-[793/480] w-full"
          />
        </div>

        <motion.div
          variants={item}
          className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row lg:col-start-1 lg:row-start-2"
        >
          <a href="#oficinas" className="btn-v3-ghost h-[57px]">
            {t.hero.workshops}
          </a>
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-v3-ghost h-[57px]"
          >
            {t.hero.docs}
          </a>
          <a
            href={DOWNLOAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-v3-primary h-[62px]"
          >
            {t.hero.download}
          </a>
        </motion.div>
      </motion.div>
    </section>
  )
}
