import { motion } from 'framer-motion'
import { CalendarDays } from 'lucide-react'
import Reveal from './ui/Reveal.jsx'

const WORKSHOPS = [
  {
    n: 1,
    title: 'JEO BRAINS na prática: IA, mapas e contexto para redações',
    body: 'Apresentação geral do JEO BRAINS e de suas principais funcionalidades: geolocalização assistida por IA, mini-mapas, Leia Também inteligente, contexto adicional e Histórias perto de mim. A oficina mostra, na prática, como a ferramenta pode apoiar redações.',
    audience:
      'editores, repórteres, gestores de produto/audiência e organizações interessadas em testar a ferramenta.',
  },
  {
    n: 2,
    title: 'Instalação e configuração do JEO BRAINS no WordPress',
    body: 'Sessão prática sobre os requisitos técnicos, instalação do plugin, configuração inicial, ativação dos módulos, integração com serviços necessários, documentação, GitHub e caminhos para adaptação ou contribuição ao código aberto.',
    audience:
      'desenvolvedores, equipes digitais, administradores de sites em WordPress e pessoas responsáveis pela implementação técnica.',
  },
]

export default function WorkshopsSection() {
  return (
    <section id="oficinas" className="bg-base py-24 sm:py-28">
      <div className="section-shell text-center">
        <Reveal>
          <h2 className="font-display text-4xl font-black uppercase tracking-tight text-brand sm:text-5xl">
            Participe das oficinas de lançamento
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-slate-300">
            Sessões online para conhecer, testar e implementar o{' '}
            <strong className="font-semibold text-white">JEO</strong> BRAINS em
            redações e organizações que usam WordPress.
          </p>
        </Reveal>

        <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
          {WORKSHOPS.map((w, i) => (
            <Reveal key={w.n} delay={i * 0.1}>
              <motion.article
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="group flex h-full flex-col rounded-xl border border-brand/40 bg-brand-darkest/30 p-8 text-left shadow-card transition-colors duration-300 hover:border-brand/70"
              >
                <div className="flex items-center justify-center gap-2 text-brand">
                  <CalendarDays className="h-5 w-5" />
                  <span className="font-display text-sm font-bold uppercase tracking-[0.25em]">
                    Oficina {w.n}
                  </span>
                </div>

                <h3 className="mt-5 text-center font-semibold leading-snug text-white">
                  {w.title}
                </h3>

                <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">
                  {w.body}
                </p>

                <p className="mt-5 text-sm leading-relaxed text-muted">
                  <strong className="font-semibold text-slate-200">Público</strong>
                  : {w.audience}
                </p>

                <div className="mt-6 flex justify-center">
                  <a
                    href="#comunidade"
                    className="inline-flex items-center justify-center rounded-md border border-white/15 bg-ink/60 px-6 py-2.5 text-sm font-semibold text-slate-100 transition-all duration-300 hover:border-brand/60 hover:bg-brand hover:text-ink"
                  >
                    Inscrever-se
                  </a>
                </div>
              </motion.article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
