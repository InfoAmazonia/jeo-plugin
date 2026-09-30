import { motion, useReducedMotion } from 'framer-motion'
import Reveal from './ui/Reveal.jsx'
import { useI18n } from '../i18n/index.jsx'
import { DOWNLOAD_URL } from '../links.js'
import demoPrint from '../assets/v3-demo-print.png'
import demoVideo from '../assets/print-animado.mp4'

/**
 * Live Demo (redesign v3) — Figma frame "Live Demo" (133:1758, 1920×1133).
 *
 * Mirrors the Figma section on the navy background (#0A1628 = v3-navy,
 * confirmed by pixel sampling of figma-ref/desktop-v3.png):
 * centered condensed title, a browser-window mockup (982px wide) with the
 * wp-admin screenshot, and a solid dark-green CTA below — all stacked with
 * 80px gaps and 120px section padding on desktop (exact Figma metrics).
 *
 * Browser mockup (Figma "Group 5" 133:1761 — note: the green bar
 * "Rectangle 365" and Ellipses 18/19/20 are HIDDEN legacy layers in Figma;
 * the visible chrome is "Chrome Top" 133:1767):
 * - Chrome bar: #1A2332, 65px tall (desktop), 1px #191E23 stroke, macOS
 *   traffic lights 12px (#FF5F56 / #FFBD2E / #27C93F), centered 400×28
 *   address pill (bg #0A1628, r8, 12px #8F9CAE text) balanced by an
 *   invisible 52px spacer on the right (Figma "Spacer" 133:1774).
 * - Print area: the 982×552 media with a 1px #191E23 stroke; window corners
 *   are SQUARE (no radius in Figma) and the group carries a soft black
 *   glow (Figma drop shadow r16, offset 0 — reproduced as a 16px blur).
 *   The Figma node fill is a VIDEO: the area plays `print-animado.mp4`
 *   (autoplay muted loop playsInline) with `v3-demo-print.png` as the
 *   poster; under `prefers-reduced-motion` only the static poster renders
 *   (same pattern the V2 hero used).
 *
 * Motion: header, mockup and CTA enter through `Reveal` with sequential
 * delays; the mockup lifts slightly on hover (scale 1.01 / y −4, spring),
 * disabled under `prefers-reduced-motion`.
 *
 * Responsive: mockup is full-width up to 982px (print keeps its 982×552
 * aspect via width/height attrs); the address pill hides below md (a
 * 400px pill doesn't fit a ~342px window) and the chrome bar shrinks to
 * 56px; the CTA scales from h-14/text-lg to the 68px/24px Figma size at lg.
 */
export default function LiveDemo() {
  const { t } = useI18n()
  const reduce = useReducedMotion()
  const demo = t.demo

  return (
    <section id="experimente" aria-labelledby="live-demo-title" className="bg-v3-navy">
      <div className="section-shell-v3 flex flex-col items-center gap-14 section-pad-v3 sm:gap-16 sm:pt-20 sm:pb-24 lg:gap-20 lg:pt-[120px] lg:pb-[120px]">
        {/* Header (Figma "Demo Header" 133:1759 — single centered title, no eyebrow) */}
        <Reveal>
          <h2
            id="live-demo-title"
            className="font-condensed text-3xl font-bold uppercase leading-[1.2] text-v3-light sm:text-4xl lg:text-[40px]"
          >
            {demo.title}
          </h2>
        </Reveal>

        {/* Browser mockup (Figma "Group 5" 133:1761) */}
        <Reveal y={40} delay={0.12} className="w-full">
          <motion.div
            whileHover={reduce ? undefined : { scale: 1.01, y: -4 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="mx-auto w-full max-w-[982px]"
          >
            <div className="overflow-hidden border border-[#191E23] shadow-[0_0_16px_rgba(0,0,0,0.55)]">
              {/* Chrome top (133:1767) — decorative, aria-hidden */}
              <div
                aria-hidden="true"
                className="flex h-14 items-center justify-between border-b border-[#191E23] bg-[#1A2332] px-4 sm:px-6 lg:h-[65px]"
              >
                <span className="flex shrink-0 items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#FF5F56]" />
                  <span className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
                  <span className="h-3 w-3 rounded-full bg-[#27C93F]" />
                </span>
                <span className="hidden h-7 w-[400px] items-center justify-center truncate rounded-lg bg-v3-navy px-4 text-xs leading-none text-[#8F9CAE] md:flex">
                  {demo.address}
                </span>
                {/* Right spacer (Figma "Spacer" 133:1774) keeps the pill optically centered */}
                <span className="w-[52px] shrink-0" />
              </div>
              {/* Media (Figma "print-animado 1" 133:1766 — VIDEO fill): loops the
                  animated screen recording; poster-only under reduced-motion. */}
              {reduce ? (
                <img
                  src={demoPrint}
                  alt={demo.printAlt}
                  width={982}
                  height={552}
                  loading="lazy"
                  decoding="async"
                  className="block w-full"
                />
              ) : (
                <video
                  src={demoVideo}
                  poster={demoPrint}
                  aria-label={demo.printAlt}
                  width={982}
                  height={552}
                  autoPlay
                  muted
                  loop
                  playsInline
                  /* 22.5 MB recording below the fold: with preload="none" and
                     IntersectionObserver-gated playback it no longer competes
                     for bandwidth with the hero's first fold; the poster holds
                     the frame until the stream buffers (rootMargin gives it a
                     head start before the section scrolls into view). */
                  preload="none"
                  /* React sets `muted` as a property, not an attribute — Chrome
                     then blocks autoplay. Force it and drive playback from the
                     observer instead of playing on mount. */
                  ref={(el) => {
                    if (!el || el.dataset.playGated) return
                    el.dataset.playGated = '1'
                    el.muted = true
                    const io = new IntersectionObserver(
                      ([entry]) => {
                        if (entry.isIntersecting) el.play().catch(() => {})
                        else el.pause()
                      },
                      { rootMargin: '600px' },
                    )
                    io.observe(el)
                  }}
                  className="block w-full"
                />
              )}
            </div>
          </motion.div>
        </Reveal>

        {/* CTA (Figma button instance 133:1775 — "Quero testar o JEO") */}
        <Reveal delay={0.24}>
          <a
            href={DOWNLOAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-v3-secondary h-14 lg:h-[68px]"
          >
            {demo.cta}
          </a>
        </Reveal>
      </div>
    </section>
  )
}
