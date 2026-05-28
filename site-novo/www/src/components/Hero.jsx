import { motion, useReducedMotion } from 'framer-motion'
import { Download, BookOpen, GraduationCap, ChevronDown } from 'lucide-react'
import JeoMark from './ui/JeoMark.jsx'
import ParallaxImage from './ui/ParallaxImage.jsx'
import heroBg from '../assets/hero-bg.jpg'

export default function Hero() {
  const reduce = useReducedMotion()

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
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
    <section className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-base">
      {/* Topographic backdrop with pointer parallax + motion afterimage */}
      <ParallaxImage
        src={heroBg}
        className="pointer-events-none absolute inset-0 overflow-hidden"
        range={34}
        scale={1.22}
        trailScale={1.32}
        trailOpacity={0.45}
      />
      {/* Darkening + teal tint + fade into next section */}
      <div className="pointer-events-none absolute inset-0 bg-brand-deep/25 mix-blend-multiply" />
      <div className="pointer-events-none absolute inset-0 bg-black/70" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-base" />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="section-shell relative z-10 flex flex-col items-center py-28 text-center"
      >
        {/* Wordmark: JEO BR[AI]NS */}
        <motion.div variants={item} className="flex items-center gap-4 sm:gap-5">
          <JeoMark className="h-16 w-auto drop-shadow-[0_6px_24px_rgba(0,0,0,0.6)] sm:h-20" />
          <span className="font-display text-5xl tracking-tight text-white sm:text-6xl">
            <span className="font-bold">JEO</span>{' '}
            <span className="font-light">
              BR<span className="text-brand">AI</span>NS
            </span>
          </span>
        </motion.div>

        <motion.p
          variants={item}
          className="mt-10 max-w-2xl text-balance text-base leading-relaxed text-slate-300/90 sm:text-lg"
        >
          Um plugin aberto para ajudar redações a personalizar a experiência de
          leitura, recircular melhor seu acervo e aproximar reportagens de seus
          territórios.
        </motion.p>

        <motion.div
          variants={item}
          className="mt-12 flex flex-col items-center gap-4 sm:flex-row"
        >
          <a href="#oficinas" className="btn-ghost group w-full sm:w-auto">
            <GraduationCap className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-6" />
            Oficinas
          </a>
          <a href="#transparencia" className="btn-ghost group w-full sm:w-auto">
            <BookOpen className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-6" />
            Documentação
          </a>
          <a href="#download" className="btn-brand group w-full sm:w-auto">
            <Download className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
            Download
          </a>
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.a
        href="#por-que"
        aria-label="Rolar para a próxima seção"
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-slate-400 transition-colors hover:text-brand"
        animate={reduce ? {} : { y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ChevronDown className="h-7 w-7" />
      </motion.a>
    </section>
  )
}
