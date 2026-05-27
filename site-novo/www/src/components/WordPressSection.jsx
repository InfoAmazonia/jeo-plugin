import { motion, useReducedMotion } from 'framer-motion'
import Reveal from './ui/Reveal.jsx'
import WordPressIcon from './ui/WordPressIcon.jsx'

const STEPS = [
  {
    n: 1,
    parts: [
      'Instale o ',
      { strong: 'plugin JEO' },
      ' no seu painel WordPress.',
    ],
  },
  {
    n: 2,
    parts: [
      'Redija sua matéria ou ',
      { strong: 'suba sua base de dados' },
      ' diretamente no editor de blocos (Gutenberg).',
    ],
  },
  {
    n: 3,
    parts: [
      'Deixe a IA processar o texto e ',
      { strong: 'visualize o mapa interativo' },
      ' gerado ao lado do conteúdo.',
    ],
  },
  {
    n: 4,
    parts: [
      'Publique e ofereça uma ',
      { strong: 'experiência imersiva' },
      ' e rica para seus leitores.',
    ],
  },
]

function StepText({ parts }) {
  return (
    <p className="text-sm leading-relaxed text-slate-200">
      {parts.map((p, i) =>
        typeof p === 'string' ? (
          <span key={i}>{p}</span>
        ) : (
          <strong key={i} className="font-semibold text-brand-light">
            {p.strong}
          </strong>
        ),
      )}
    </p>
  )
}

export default function WordPressSection() {
  const reduce = useReducedMotion()

  return (
    <section id="integracao" className="bg-base py-10">
      <div className="section-shell">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-dark via-brand to-brand-light bg-[length:200%_200%] p-8 shadow-card animate-gradient-pan sm:p-12 lg:p-16">
          {/* subtle texture */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_45%)]" />

          {/* Banner header */}
          <div className="relative flex flex-col items-center gap-8 text-center md:flex-row md:items-center md:gap-12 md:text-left">
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8, rotate: -10 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <WordPressIcon className="h-28 w-28 text-ink/80 drop-shadow-lg sm:h-36 sm:w-36" />
            </motion.div>

            <Reveal>
              <h2 className="font-display text-4xl font-extrabold uppercase leading-[1.02] tracking-tight text-ink sm:text-5xl">
                Integrado ao<br className="hidden sm:block" /> ecossistema que<br className="hidden sm:block" /> você já usa
              </h2>
            </Reveal>
          </div>

          {/* Steps */}
          <div className="relative mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 0.08}>
                <div className="group">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-sm font-bold uppercase tracking-[0.2em] text-ink/70">
                      Passo
                    </span>
                    <span className="font-display text-4xl font-black leading-none text-ink/90">
                      {step.n}
                    </span>
                  </div>
                  <div className="mt-3 rounded-lg border-t-2 border-brand-light/60 bg-ink/85 p-5 backdrop-blur-sm transition-transform duration-300 group-hover:-translate-y-1">
                    <StepText parts={step.parts} />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
