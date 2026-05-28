import { motion, useReducedMotion } from 'framer-motion'
import Reveal from './ui/Reveal.jsx'
import WordPressIcon from './ui/WordPressIcon.jsx'

const STEPS = [
  {
    n: 1,
    lead: 'Instale o plugin no WordPress',
    rest: 'Ative o Jeo e os módulos de IA no ambiente que sua redação já usa.',
  },
  {
    n: 2,
    lead: 'Escreva ou edite sua reportagem',
    rest: 'O sistema analisa o texto e identifica lugares, temas e conexões com o acervo.',
  },
  {
    n: 3,
    lead: 'Revise as sugestões da IA',
    rest: 'Confirme localizações, ajuste mapas, aprove ou edite o contexto adicional.',
  },
  {
    n: 4,
    lead: 'Publique com mais contexto',
    rest: 'A reportagem pode ganhar mini-mapa, Leia Também inteligente e informações adicionais para orientar melhor o leitor.',
  },
]

export default function WordPressSection() {
  const reduce = useReducedMotion()

  return (
    <section id="integracao" className="bg-base py-10">
      <div className="section-shell">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand via-brand-dark to-muted-3 p-8 shadow-card sm:p-12 lg:p-14">
          {/* subtle texture */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.18),transparent_45%)]" />

          {/* Banner header */}
          <div className="relative flex flex-col items-center gap-6 text-center md:flex-row md:items-center md:gap-10 md:text-left">
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8, rotate: -10 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <WordPressIcon className="h-24 w-24 text-ink/85 drop-shadow-lg sm:h-32 sm:w-32" />
            </motion.div>

            <Reveal>
              <h2 className="font-display text-4xl font-extrabold uppercase leading-[1.02] tracking-tight text-ink sm:text-5xl">
                Funciona dentro
                <br className="hidden sm:block" /> do WordPress
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
                  <div className="mt-3 h-full rounded-lg border-t-2 border-brand-light/70 bg-ink/85 p-5 backdrop-blur-sm transition-transform duration-300 group-hover:-translate-y-1">
                    <p className="text-sm leading-relaxed text-slate-200">
                      <strong className="font-semibold text-brand-light">
                        {step.lead}
                      </strong>
                      : {step.rest}
                    </p>
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
