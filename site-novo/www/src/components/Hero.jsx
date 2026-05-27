import { motion, useReducedMotion } from 'framer-motion'
import { Download, BookOpen, ChevronDown } from 'lucide-react'
import TopoBackground from './ui/TopoBackground.jsx'
import JeoMark from './ui/JeoMark.jsx'

export default function Hero() {
  const reduce = useReducedMotion()

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.12, delayChildren: 0.15 },
    },
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
    <section className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-ink">
      {/* Cartographic backdrop */}
      <TopoBackground className="pointer-events-none absolute inset-0 h-full w-full" />

      {/* Ambient teal glows */}
      <div className="pointer-events-none absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-brand/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 top-10 h-80 w-80 rounded-full bg-brand/10 blur-[120px]" />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="section-shell relative z-10 flex flex-col items-center py-28 text-center"
      >
        {/* Wordmark */}
        <motion.div variants={item} className="flex items-end gap-4 sm:gap-5">
          <JeoMark className="h-16 w-auto drop-shadow-[0_6px_24px_rgba(0,0,0,0.5)] sm:h-20" />
          <span className="font-display text-5xl font-bold tracking-tight text-white sm:text-6xl">
            JEO <span className="font-light text-slate-300">BRAINS</span>
          </span>
        </motion.div>

        <motion.p
          variants={item}
          className="mt-10 max-w-xl text-balance text-base leading-relaxed text-slate-400 sm:text-lg"
        >
          Inteligência Artificial para criar e publicar geojornalismo
          interativo no WordPress.
        </motion.p>

        <motion.div
          variants={item}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <a href="#download" className="btn-brand group w-full sm:w-auto">
            <Download className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
            Fazer download
          </a>
          <a href="#docs" className="btn-ghost group w-full sm:w-auto">
            <BookOpen className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-6" />
            Acessar a Documentação
          </a>
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.a
        href="#por-que"
        aria-label="Rolar para a próxima seção"
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-slate-500 transition-colors hover:text-brand"
        animate={reduce ? {} : { y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ChevronDown className="h-7 w-7" />
      </motion.a>

      {/* Fade into next section */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-base" />
    </section>
  )
}
