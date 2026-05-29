import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Download, BookOpen, GraduationCap, ChevronDown } from 'lucide-react'
import JeoMark from './ui/JeoMark.jsx'
import heroPoster from '../assets/hero-bg.jpg'
import heroVideo from '../assets/hero-background.mp4'
import jeoWordmark from '../assets/jeo-brains-wordmark.svg'
import { DOWNLOAD_URL, DOCS_URL } from '../links.js'

export default function Hero() {
  const reduce = useReducedMotion()
  const [showCue, setShowCue] = useState(true)

  // Scroll cue is visible only near the very top of the page.
  useEffect(() => {
    const onScroll = () => setShowCue(window.scrollY < 100)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
      {/* Looping background video — poster (the former still bg) shows until it plays.
          Under reduced motion only the static poster renders. */}
      {reduce ? (
        <img
          src={heroPoster}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={heroVideo}
          poster={heroPoster}
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
        />
      )}
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
        {/* Wordmark: J pillar mark + the JEO BRAINS logotype (SVG from Figma) */}
        <motion.div variants={item} className="flex items-center gap-4 sm:gap-5">
          <JeoMark className="h-16 w-auto drop-shadow-[0_6px_24px_rgba(0,0,0,0.6)] sm:h-20" />
          <img
            src={jeoWordmark}
            alt="JEO BRAINS"
            className="h-11 w-auto drop-shadow-[0_6px_24px_rgba(0,0,0,0.6)] sm:h-[3.25rem]"
          />
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
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost group w-full sm:w-auto"
          >
            <BookOpen className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-6" />
            Documentação
          </a>
          <a
            href={DOWNLOAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-brand group w-full sm:w-auto"
          >
            <Download className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
            Download
          </a>
        </motion.div>
      </motion.div>

      {/* Scroll cue — centered via auto margins (no transform, so it can't fight
          the Framer translateY animation); fades out once you scroll past 100px. */}
      <motion.a
        href="#por-que"
        aria-label="Rolar para a próxima seção"
        className={`absolute inset-x-0 bottom-8 z-10 mx-auto w-max text-slate-400 transition-colors hover:text-brand ${
          showCue ? '' : 'pointer-events-none'
        }`}
        animate={
          reduce
            ? { opacity: showCue ? 1 : 0 }
            : { y: [0, 8, 0], opacity: showCue ? 1 : 0 }
        }
        transition={{
          y: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
          opacity: { duration: 0.3 },
        }}
      >
        <ChevronDown className="h-7 w-7" />
      </motion.a>
    </section>
  )
}
