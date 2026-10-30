import { useI18n } from '../i18n/index.jsx'
import { DOWNLOAD_URL } from '../links.js'
import wordmark from '../assets/v3-footer-wordmark.png'
import infoamazoniaLogo from '../assets/v3-infoamazonia-logo.png'
import hacklabLogo from '../assets/hacklab-logo.svg'

/**
 * Footer (redesign v3) — Figma footer instance (133:1801, 1920×365).
 *
 * Top band (~301px, centered 1319px row on 1920): wordmark (400×141,
 * v3-footer-wordmark.png) + nav links + "Instalar grátis" CTA, 120px
 * between groups, 40px between links, 80px padding above the wordmark.
 *
 * Bottom bar (64px, #0A1628 = v3-navy, declared fill): partner logos
 * right-aligned (as in the Figma) — "produção" + InfoAmazonia (white
 * variant, v3-infoamazonia-logo.png — the footer bg is dark) and
 * "desenvolvimento" + hacklab-logo.svg. 280px side padding at 2xl
 * (Figma paddingLeft/Right 280). codesinfo does NOT appear in the v3
 * footer. The terms-of-use trigger + modal were removed (request,
 * 2026-10-30) — the Figma "Acesse os / Termos de uso e privacidade"
 * mixed-style run on the left of this bar is no longer rendered.
 *
 * Top band color decision: the tokens doc lists #101C2E
 * (v3-navy-footer), but the exported wordmark asset carries a baked
 * background of #0D192B (the rendered band color in desktop-v3.png).
 * The band uses the exact baked color so the asset blends seamlessly;
 * if the asset is ever replaced with a transparent one, switch back to
 * `bg-v3-navy-footer`.
 */

export default function FooterV3() {
  const { t } = useI18n()

  const NAV = [
    { label: t.nav.home, href: '#top' },
    { label: t.nav.features, href: '#recursos' },
    { label: t.nav.ai, href: '#inteligencia-artificial' },
    { label: t.nav.try, href: '#experimente' },
  ]

  return (
    <footer className="bg-[#0D192B]">
      {/* Top band — wordmark + nav + CTA, centered (Figma Frame 20, 1319px row).
          Issue #669: between lg and 1400px the Figma metrics (400px wordmark +
          120px group gaps + text-lg links + 40px link gaps ≈ 1316px) exceed the
          available inner width (~929px at 1024), so the CTA wrapped under the
          nav. Fix: progressive tightening below 1400px — smaller wordmark,
          text-base links and narrower gaps at lg/xl — with every value restored
          via min-[1400px]: so the layout at >=1400px is pixel-identical (Δ0).
          Budget check at the worst case (1024px, inner ≈ 929px):
          wordmark 284 + nav ~412 + CTA 160 + gaps 48 ≈ 904px — fits inline. */}
      <div className="section-shell-v3">
        <div className="flex flex-col items-center gap-y-10 section-pad-v3 sm:py-16 lg:flex-row lg:flex-wrap lg:justify-center lg:gap-x-6 lg:py-20 xl:gap-x-10 min-[1400px]:gap-x-[120px]">
          <a href="#top" className="flex shrink-0 items-center" aria-label="JEO Maps">
            <img
              src={wordmark}
              alt="JEO Maps"
              width={400}
              height={141}
              className="h-[100px] w-auto xl:h-[120px] min-[1400px]:h-[141px]"
            />
          </a>

          <nav aria-label={t.footer.navLabel} className="flex flex-wrap items-center justify-center gap-x-10 gap-y-2 lg:gap-x-5 xl:gap-x-8 min-[1400px]:gap-x-10">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="text-lg leading-[1.5] text-[#8F9CAE]/90 transition-colors hover:text-v3-light focus:outline-none focus-visible:ring-2 focus-visible:ring-v3-green lg:text-base min-[1400px]:text-lg"
              >
                {n.label}
              </a>
            ))}
          </nav>

          <a
            href={DOWNLOAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-v3-primary h-12 shrink-0 px-6 text-[16px]"
          >
            {t.footer.cta}
          </a>
        </div>
      </div>

      {/* Bottom bar — partner logos (Figma "logos" band, 64px). The
          terms-of-use trigger was removed (request, 2026-10-30); the logos
          keep their original position, right-aligned from lg up. */}
      <div className="bg-v3-navy">
        <div className="flex flex-col items-center justify-center gap-x-12 gap-y-4 px-6 py-4 sm:px-10 lg:flex-row lg:flex-wrap lg:justify-end xl:px-16 2xl:flex-nowrap 2xl:px-[280px]">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-3">
            <div className="flex items-center gap-5">
              <span className="text-xs leading-[1.5] text-muted">
                {t.footer.production}
              </span>
              <a
                href="https://infoamazonia.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-80"
              >
                <img
                  src={infoamazoniaLogo}
                  alt="InfoAmazonia"
                  className="h-8 w-auto"
                />
              </a>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs leading-[1.5] text-muted">
                {t.footer.development}
              </span>
              <a
                href="https://hacklab.com.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-80"
              >
                <img
                  src={hacklabLogo}
                  alt="hacklab/"
                  className="h-4 w-auto"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
