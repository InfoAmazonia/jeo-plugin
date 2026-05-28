import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import JeoMark from './ui/JeoMark.jsx'
import infoamazonia from '../assets/infoamazonia.png'
import codesinfo from '../assets/codesinfo.png'
import hacklabLogo from '../assets/hacklab-logo.svg'
import jeoWordmark from '../assets/jeo-wordmark.svg'

const NAV = ['BRAINS', 'THEME', 'PLUGIN']

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

export default function Footer() {
  const [termsOpen, setTermsOpen] = useState(false)

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
    <footer className="bg-footer">
      {/* Main band — logo + nav grouped and centered, matching Figma */}
      <div className="section-shell flex flex-col flex-wrap items-center justify-center gap-x-20 gap-y-8 py-16 md:flex-row">
        <a href="#top" className="flex items-center gap-5">
          <JeoMark className="h-20 w-auto" />
          <img src={jeoWordmark} alt="JEO" className="h-9 w-auto" />
        </a>

        <nav className="flex flex-wrap items-center justify-center gap-8">
          {NAV.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="group relative text-base font-normal uppercase tracking-wide text-white/90 transition-colors hover:text-white"
            >
              {item}
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-brand transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
          <a
            href="#download"
            className="rounded-md bg-brand/90 px-6 py-3 text-sm font-bold text-ink transition-all duration-300 hover:bg-brand hover:shadow-glow-brand"
          >
            Install free
          </a>
        </nav>
      </div>

      {/* Bottom bar — dark, matches the InfoAmazonia logo background */}
      <div className="bg-base">
        <div className="section-shell flex flex-col items-center gap-8 py-5 text-center md:flex-row md:justify-between md:text-left">
          <button
            type="button"
            onClick={() => setTermsOpen(true)}
            className="text-base text-white/90 transition-colors hover:text-white"
          >
            Termos de uso e privacidade
          </button>

          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-3">
              <img src={infoamazonia} alt="InfoAmazonia" className="h-7 w-auto" />
              <img src={hacklabLogo} alt="hacklab/" className="h-[11px] w-auto" />
              <img src={codesinfo} alt="codesinfo" className="h-7 w-auto" />
            </div>
            <p className="text-xs text-muted">
              Uma produção de{' '}
              <strong className="font-bold text-white underline">infomazonia</strong>{' '}
              com desenvolvimento de{' '}
              <strong className="font-bold text-white underline">hacklab/</strong> e
              financiado pelo{' '}
              <strong className="font-bold text-white underline">codesinfo</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Terms of use modal */}
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
              className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-panel shadow-card"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <h3 className="font-condensed font-display text-2xl font-bold uppercase tracking-tight text-white">
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
                {TERMS.map((t) => (
                  <div key={t.h}>
                    <h4 className="font-semibold text-brand-light">{t.h}</h4>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{t.p}</p>
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
