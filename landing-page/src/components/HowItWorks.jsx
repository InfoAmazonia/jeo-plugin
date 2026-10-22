import Reveal from './ui/Reveal.jsx'
import { useI18n } from '../i18n/index.jsx'

/**
 * How It Works (redesign v3) — Figma frame "How It Works" (133:1738).
 *
 * Mirrors the Figma section on a light background (#FAFAF8 = v3-light):
 * centered header (title + 1152px lead) and a 3-step row where each card
 * is a mint (#E8F0E8 = v3-mint) rounded-20 box (32px padding, 40px inner
 * gaps) with a 48×48 numbered badge (#00A67E = v3-accent).
 *
 * Notes:
 * - Desktop stagger (Figma 133:1742): card tops sit at +60/+15/+0px via
 *   margin-top (NOT translate — Reveal animates `y` through an inline
 *   transform that would clobber a CSS translate). Card heights are
 *   content-driven (350/440/470 at 512px width in Figma), so the grid
 *   uses `items-start` and cards never stretch.
 * - Titles render UPPERCASE in the design (verified against the
 *   desktop-v3.png render via cap-height pixel profiling); copy is stored
 *   as typed and uppercased with the `uppercase` class — same convention
 *   as the ResourceSlider/FeaturesShowcase.
 * - Badge numbers are decorative: the semantic order lives in the `<ol>`,
 *   so the numeral is `aria-hidden`.
 * - Mobile: cards stack in order 1→2→3, full width, no vertical stagger
 *   (offsets apply at lg only) — the stagger reads as clutter when
 *   stacked. Section padding uses the shared `section-pad-v3` base
 *   (48px mobile) like every v3 section; sm:/lg: keep the Figma values.
 * - Motion: header + each card enter through `Reveal` with a subtle
 *   sequential delay (reduced-motion aware).
 */

// Figma y-offsets for the step cards (desktop only).
const STEP_OFFSETS = ['lg:mt-[60px]', 'lg:mt-[15px]', 'lg:mt-0']

export default function HowItWorks() {
  const { t } = useI18n()
  const hiw = t.hiw

  return (
    <section
      id="como-comecar"
      aria-labelledby="how-it-works-title"
      className="bg-v3-light"
    >
      <div className="section-shell-v3 section-pad-v3 sm:pt-20 sm:pb-24 lg:pt-[100px] lg:pb-[120px]">
        {/* Header (Figma "How It Works Header" 133:1739) */}
        <div className="mx-auto flex max-w-[1152px] flex-col items-center gap-4 text-center">
          <Reveal>
            <h2
              id="how-it-works-title"
              className="font-condensed text-3xl font-bold uppercase leading-[1.2] text-v3-navy sm:text-4xl lg:text-[40px]"
            >
              {hiw.title}
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="text-lg leading-[1.5] text-v3-gray sm:text-xl">
              {hiw.lead}
            </p>
          </Reveal>
        </div>

        {/* Steps row (Figma "Steps Row" 133:1742): 3× 512px cards, 32px gap */}
        <ol className="mt-12 grid list-none items-start gap-8 lg:mt-16 lg:grid-cols-3">
          {hiw.steps.map((step, index) => (
            <li key={step.title} className={STEP_OFFSETS[index]}>
              <Reveal delay={0.12 + index * 0.1}>
                <article className="flex flex-col gap-10 rounded-[20px] bg-v3-mint p-8">
                  <span
                    aria-hidden="true"
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-v3-accent font-condensed text-[26px] font-bold leading-none text-v3-light sm:text-[32px]"
                  >
                    {index + 1}
                  </span>
                  <h3 className="font-condensed text-2xl font-bold uppercase leading-[1.2] text-v3-navy sm:text-[32px]">
                    {step.title}
                  </h3>
                  <p className="text-lg leading-[1.5] text-v3-navy lg:text-xl">
                    {step.body}
                  </p>
                </article>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
