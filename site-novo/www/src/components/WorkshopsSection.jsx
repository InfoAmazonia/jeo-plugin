import { motion } from 'framer-motion'
import { CalendarDays } from 'lucide-react'
import Reveal from './ui/Reveal.jsx'

const WORKSHOPS = [
  { date: '25/05/26 às 14:00', title: 'Introdução ao Geojornalismo com IA' },
  { date: '25/05/26 às 14:00', title: 'Configurando o JEO WP para ONGs e Coletivos' },
  { date: '25/05/26 às 14:00', title: 'Segurança de Dados e Infraestrutura Open-Source' },
]

export default function WorkshopsSection() {
  return (
    <section id="oficinas" className="bg-base pb-24 sm:pb-28">
      <div className="section-shell text-center">
        <Reveal>
          <h2 className="font-display text-4xl font-black uppercase tracking-tight text-brand sm:text-5xl">
            Aprenda com a comunidade
          </h2>
          <p className="mt-3 font-display text-lg font-bold uppercase tracking-wide text-slate-200">
            Nossas próximas oficinas:
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {WORKSHOPS.map((w, i) => (
            <Reveal key={w.title} delay={i * 0.1}>
              <motion.article
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="group flex h-full flex-col items-center rounded-xl border border-brand/25 bg-card-teal/70 p-8 text-center shadow-card transition-colors duration-300 hover:border-brand/60"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand/15 text-brand ring-1 ring-brand/30 transition-colors duration-300 group-hover:bg-brand/25">
                  <CalendarDays className="h-6 w-6" />
                </span>

                <p className="mt-5 font-display text-lg font-bold tracking-wide text-brand-light">
                  {w.date}
                </p>

                <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-300">
                  {w.title}
                </p>

                <a
                  href="#comunidade"
                  className="mt-6 inline-flex items-center justify-center rounded-md bg-brand px-5 py-2 text-xs font-semibold text-ink transition-all duration-300 hover:bg-brand-light hover:shadow-glow-brand"
                >
                  Inscrever-se
                </a>
              </motion.article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
