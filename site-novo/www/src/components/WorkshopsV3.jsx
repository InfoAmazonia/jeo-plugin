import { Rocket, Github, CodeXml } from 'lucide-react'
import Reveal from './ui/Reveal.jsx'
import { useI18n } from '../i18n/index.jsx'
import { GITHUB_URL, DOCS_URL } from '../links.js'

/**
 * Workshops + Community (redesign v3) — Figma section "Workshops"
 * (133:1776, 1920×711) on the mint background (#E8F0E8 = v3-mint,
 * confirmed by pixel sampling of figma-ref/desktop-v3.png).
 *
 * Two boxes side by side (48px gap, 1600px container, 100px section
 * padding on desktop):
 *
 * Workshop Card (Figma 133:1777, 776×511) — light card (#FAFAF8,
 * 1px #E6E7E7 hairline, ~r16, 40px padding):
 * - Header row: 48px rocket icon (dark strokes in the design) + the
 *   40px condensed title "Oficinas de lançamento" (mixed case in the
 *   Figma characters — no uppercase transform here, unlike other v3
 *   headings) with 16px between them.
 * - 24px bold lead + 18px/150% body, both navy (#0A1628).
 * - Form placeholder (human decision: no backend). Fields mirror the
 *   Figma Form Side (133:1786): two 56px inputs (mint fill, 1px green
 *   border, r12, centered 16px gray text) + a full-width 62px submit
 *   button. The Figma button fill (#19AE8A, sampled) is not a token —
 *   kept as an arbitrary value with a comment. The button is
 *   permanently disabled (attenuated via opacity, cursor-not-allowed)
 *   with a static "Inscrições em breve" caption — the form has no
 *   submit handler and performs no network calls.
 *
 * Community Box (Figma 133:1793, 776×452, top offset +30px on desktop):
 * - 40px condensed uppercase eyebrow + the long body preserved as the
 *   exact three paragraphs from the Figma node (explicit line breaks).
 * - Figma "Frame 23" buttons: borderless icon+label links in the accent
 *   green (#00A67E), 32px icons, 18px bold labels, 40px row inset.
 *   GitHub → GITHUB_URL, docs → DOCS_URL. The Figma uses mdi glyphs
 *   ("mdi:github" / "Code off"); lucide Github/CodeXml are the closest
 *   available equivalents.
 *
 * Motion: card and community content enter through `Reveal` with a
 * sequential delay (reduced-motion aware via Reveal).
 */
export default function WorkshopsV3() {
  const { t } = useI18n()
  const ws = t.workshops

  const inputClass =
    'h-14 w-full rounded-xl border border-v3-green bg-v3-mint px-6 text-center ' +
    'text-[16px] leading-[1.5] text-v3-navy placeholder:text-v3-gray ' +
    'transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-v3-green/40'

  return (
    <section id="oficinas" aria-labelledby="oficinas-title" className="bg-v3-mint">
      <div className="section-shell-v3 grid items-start gap-12 section-pad-v3 sm:pt-20 sm:pb-20 lg:grid-cols-2 lg:pt-[100px] lg:pb-[100px]">
        {/* Workshop Card (Figma 133:1777) */}
        <Reveal className="h-full">
          <article className="flex h-full flex-col gap-8 rounded-2xl border border-[#E6E7E7] bg-v3-light p-6 sm:p-8 lg:gap-10 lg:p-10">
            <div className="flex items-center gap-4">
              <Rocket
                aria-hidden="true"
                className="h-12 w-12 shrink-0 text-v3-navy"
                strokeWidth={1.75}
              />
              <h2
                id="oficinas-title"
                className="font-condensed text-3xl font-bold leading-[1.2] text-v3-navy sm:text-4xl lg:text-[40px]"
              >
                {ws.cardTitle}
              </h2>
            </div>

            <div className="flex flex-col gap-8 lg:gap-10">
              <h3 className="text-xl font-bold leading-[1.5] text-v3-navy lg:text-2xl">
                {ws.cardLead}
              </h3>
              <p className="text-base leading-[1.5] text-v3-navy lg:text-lg">
                {ws.cardBody}
              </p>
            </div>

            {/* Form Side (Figma 133:1786) — placeholder, no submit handler */}
            <form className="mt-auto flex flex-col gap-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <input
                  type="text"
                  name="name"
                  required
                  autoComplete="name"
                  aria-label={ws.formNameLabel}
                  placeholder={ws.formNamePlaceholder}
                  className={inputClass}
                />
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  aria-label={ws.formEmailLabel}
                  placeholder={ws.formEmailPlaceholder}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col items-center gap-2">
                <button
                  type="submit"
                  disabled
                  className="h-14 w-full rounded-lg bg-[#19AE8A] text-lg font-bold text-v3-light transition-all duration-300 enabled:hover:brightness-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-v3-green focus-visible:ring-offset-2 focus-visible:ring-offset-v3-light disabled:cursor-not-allowed disabled:opacity-60 lg:h-[62px] lg:text-xl"
                >
                  {ws.formSubmit}
                </button>
                <p className="text-center text-sm font-bold text-v3-accent lg:text-base">
                  {ws.formSuccess}
                </p>
              </div>
            </form>
          </article>
        </Reveal>

        {/* Community Box (Figma 133:1793 — +30px top offset on desktop) */}
        <Reveal delay={0.12} className="lg:mt-[30px]">
          <div className="flex flex-col gap-8 lg:gap-10">
            <h3 className="font-condensed text-3xl font-bold leading-[1.2] text-v3-navy sm:text-4xl lg:text-[40px]">
              {ws.communityTitle}
            </h3>
            <div className="text-base leading-[1.5] text-v3-navy lg:text-lg">
              {ws.communityBody.map((paragraph, i) => (
                <p key={i} className={i > 0 ? 'mt-[1.5em]' : undefined}>
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Frame 23 (Figma 133:1796) — 40px row inset, ~40px between links */}
            <div className="flex flex-wrap gap-x-10 gap-y-3 pl-0 lg:pl-10">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex h-16 items-center gap-2 text-v3-accent transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-v3-green focus-visible:ring-offset-2 focus-visible:ring-offset-v3-mint"
              >
                <Github aria-hidden="true" className="h-8 w-8" strokeWidth={1.75} />
                <span className="text-lg font-bold underline-offset-4 group-hover:underline">
                  {ws.communityGithub}
                </span>
              </a>
              <a
                href={DOCS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex h-16 items-center gap-2 text-v3-accent transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-v3-green focus-visible:ring-offset-2 focus-visible:ring-offset-v3-mint"
              >
                <CodeXml aria-hidden="true" className="h-8 w-8" strokeWidth={1.75} />
                <span className="text-lg font-bold underline-offset-4 group-hover:underline">
                  {ws.communityDocs}
                </span>
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
