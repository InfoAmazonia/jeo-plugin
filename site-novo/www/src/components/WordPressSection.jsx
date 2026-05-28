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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-brand to-muted-3 bg-[length:200%_200%] p-8 shadow-card animate-gradient-pan [animation-duration:14s] sm:p-12 lg:p-14">
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
              <h2 className="font-condensed font-display text-4xl font-bold uppercase leading-[1.05] tracking-tight text-ink sm:text-5xl">
                Funciona dentro
                <br className="hidden sm:block" /> do WordPress
              </h2>
            </Reveal>
          </div>

          {/* Steps */}
          <div className="relative mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 0.08} className="h-full">
                <div className="group flex h-full flex-col">
                  <div className="flex items-baseline gap-2 text-ink/80">
                    <span className="font-condensed font-display text-2xl font-bold uppercase tracking-wide">
                      Passo
                    </span>
                    <span className="font-condensed font-display text-5xl font-bold leading-none sm:text-6xl">
                      {step.n}
                    </span>
                  </div>
                  <div className="mt-3 flex-1 rounded-lg border-t-2 border-brand bg-gradient-to-b from-card-dark to-base p-5 backdrop-blur-sm transition-transform duration-300 group-hover:-translate-y-1">
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
