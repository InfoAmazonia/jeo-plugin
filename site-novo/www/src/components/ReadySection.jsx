import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Play, X } from 'lucide-react'
import Reveal from './ui/Reveal.jsx'
import editorPrint from '../assets/editor-print.png'
import printVideo from '../assets/print-animado.mp4'

export default function ReadySection() {
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)

  // Close on Escape and lock body scroll while the modal is open.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <section id="tudo-pronto" className="relative overflow-hidden bg-base py-24 sm:py-28">
      <div className="section-shell grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
        {/* Editor screenshot (real Figma asset) — click to play the walkthrough video */}
        <Reveal y={40} className="order-2 lg:order-1">
          <motion.div
            animate={reduce ? {} : { y: [0, -12, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            className="relative"
          >
            <div className="pointer-events-none absolute -inset-6 -z-10 rounded-3xl bg-brand/10 blur-3xl" />
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Assistir ao vídeo de demonstração"
              className="group relative block w-full overflow-hidden rounded-xl border border-white/10 shadow-card ring-1 ring-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-light"
            >
              <img
                src={editorPrint}
                alt="Editor do WordPress (Gutenberg) com as sugestões do JEO BRAINS"
                className="w-full transition-transform duration-500 group-hover:scale-[1.02]"
              />
              {/* Darken slightly on hover so the play affordance reads */}
              <span className="pointer-events-none absolute inset-0 bg-black/10 transition-colors duration-300 group-hover:bg-black/30" />
              {/* Play affordance */}
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-brand/90 text-ink shadow-glow-brand transition-transform duration-300 group-hover:scale-110">
                  {!reduce && (
                    <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand/60" />
                  )}
                  <Play className="h-8 w-8 translate-x-0.5 fill-current" />
                </span>
              </span>
            </button>
          </motion.div>
        </Reveal>

        {/* Copy */}
        <div className="order-1 lg:order-2">
          <Reveal>
            <h2 className="font-condensed font-display text-4xl font-extrabold uppercase leading-[1.05] tracking-tight text-white sm:text-5xl">
              Tudo pronto para{' '}
              <span className="text-brand">transformar</span> suas reportagens?
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted">
              Veja como uma matéria no WordPress pode ganhar localização,
              mini-mapa, contexto adicional e recomendações de leitura
              relacionadas ao tema e ao território — tudo com revisão editorial
              antes da publicação.
            </p>
          </Reveal>
        </div>
      </div>

      {/* Video modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Vídeo de demonstração do JEO BRAINS"
          >
            <motion.div
              className="relative w-full max-w-4xl"
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar vídeo"
                className="absolute -top-3 -right-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-base text-white ring-1 ring-white/20 transition-colors hover:bg-brand hover:text-ink sm:-top-4 sm:-right-4"
              >
                <X className="h-5 w-5" />
              </button>
              <video
                className="w-full rounded-xl border border-white/10 shadow-card ring-1 ring-black/40"
                src={printVideo}
                controls
                autoPlay
                loop
                playsInline
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
