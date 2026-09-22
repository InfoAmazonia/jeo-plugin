import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
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
 * Bottom bar (64px, #0A1628 = v3-navy, declared fill): terms trigger on
 * the left ("Acesse os" in light + "Termos de uso e privacidade" in
 * green #00DBA6 — mixed style runs confirmed by pixel sampling) and the
 * partner logos on the right: "produção" + InfoAmazonia (white variant,
 * v3-infoamazonia-logo.png — the footer bg is dark) and
 * "desenvolvimento" + hacklab-logo.svg. 280px side padding at 2xl
 * (Figma paddingLeft/Right 280). codesinfo does NOT appear in the v3
 * footer.
 *
 * Top band color decision: the tokens doc lists #101C2E
 * (v3-navy-footer), but the exported wordmark asset carries a baked
 * background of #0D192B (the rendered band color in desktop-v3.png).
 * The band uses the exact baked color so the asset blends seamlessly;
 * if the asset is ever replaced with a transparent one, switch back to
 * `bg-v3-navy-footer`.
 *
 * Terms modal: carried over from the legacy Footer (content is
 * placeholder PT-BR by design — see issue #669 slice S6); only the
 * trigger string is translated. Escape closes, body scroll locks.
 */
const TERMS = [
  {
    h: 'Aceitação dos termos',
    p: 'Ao acessar e utilizar o JEO BRAINS você concorda com os termos descritos nesta página. O uso do plugin e dos materiais relacionados implica a leitura e a concordância com estas condições.',
  },
  {
    h: 'Uso da ferramenta',
    p: 'O JEO BRAINS é um plugin de código aberto destinado a apoiar redações e organizações na produção de geojornalismo no WordPress. As sugestões geradas por IA são apoios editoriais e devem sempre passar por revisão humana antes da publicação.',
  },
  {
    h: 'Privacidade e LGPD',
    p: 'Tratamos dados pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD). Coletamos apenas o necessário para o funcionamento do serviço e para o contato solicitado por você, e não compartilhamos esses dados com terceiros sem a sua autorização.',
  },
  {
    h: 'Cookies',
    p: 'Utilizamos cookies essenciais para o funcionamento do site e cookies opcionais para entender o uso e melhorar a experiência. Você pode gerenciar suas preferências no seu navegador a qualquer momento.',
  },
  {
    h: 'Código aberto e responsabilidade',
    p: 'O JEO é distribuído como software livre, sem garantias. Algumas integrações (mapas, serviços de IA) podem exigir chaves e custos próprios de cada organização. O uso é de responsabilidade de quem implementa a ferramenta.',
  },
]

export default function FooterV3() {
  const { t } = useI18n()
  const [termsOpen, setTermsOpen] = useState(false)

  const NAV = [
    { label: t.nav.home, href: '#top' },
    { label: t.nav.features, href: '#recursos' },
    { label: t.nav.ai, href: '#inteligencia-artificial' },
    { label: t.nav.try, href: '#experimente' },
  ]

  useEffect(() => {
    if (!termsOpen) return
    const onKey = (e) => e.key === 'Escape' && setTermsOpen(false)
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [termsOpen])

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

      {/* Bottom bar — terms trigger + partner logos (Figma "logos" band, 64px) */}
      <div className="bg-v3-navy">
        <div className="flex flex-col items-center gap-x-12 gap-y-4 px-6 py-4 sm:px-10 lg:flex-row lg:flex-wrap lg:justify-between xl:px-16 2xl:flex-nowrap 2xl:px-[280px]">
          <button
            type="button"
            onClick={() => setTermsOpen(true)}
            className="text-[16px] leading-[1.5] text-v3-light transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-v3-green"
          >
            {t.footer.termsLead}{' '}
            <span className="text-v3-green">{t.footer.termsLink}</span>
          </button>

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

      {/* Terms of use modal — placeholder PT-BR content (by design, see header note) */}
      <AnimatePresence>
        {termsOpen && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setTermsOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Termos de uso e privacidade"
          >
            <motion.div
              className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-v3-navy shadow-card"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <h3 className="font-condensed text-2xl font-bold uppercase tracking-tight text-v3-light">
                  Termos de uso e privacidade
                </h3>
                <button
                  type="button"
                  onClick={() => setTermsOpen(false)}
                  aria-label="Fechar"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-5 overflow-y-auto px-6 py-6">
                {TERMS.map((term) => (
                  <div key={term.h}>
                    <h4 className="font-semibold text-v3-green">{term.h}</h4>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{term.p}</p>
                  </div>
                ))}
                <p className="pt-2 text-xs text-muted-2">
                  Última atualização: maio de 2026. Este é um texto informativo de
                  exemplo e não substitui orientação jurídica.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  )
}
