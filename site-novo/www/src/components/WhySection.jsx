import Reveal from './ui/Reveal.jsx'

const PAINS = [
  {
    title: 'Complexidade técnica',
    now: 'Criar mapas, localizar reportagens e conectar conteúdos por território exige tempo, conhecimento técnico e processos manuais.',
    jeo: 'A IA sugere localizações, mapas e conexões diretamente no WordPress, sempre com revisão editorial.',
  },
  {
    title: 'Falta de contexto visual',
    now: 'Muitas reportagens perdem impacto porque o leitor não visualiza onde a história acontece.',
    jeo: 'Cada matéria pode ganhar mini-mapas e camadas visuais que ajudam a explicar a dimensão territorial da narrativa.',
  },
  {
    title: 'Baixa recirculação do acervo',
    now: 'Reportagens antigas e relevantes ficam pouco visíveis depois da publicação.',
    jeo: 'O Leia Também inteligente recomenda conteúdos relacionados por tema e proximidade geográfica, aumentando a vida útil do acervo.',
  },
  {
    title: 'Pouca personalização da experiência',
    now: 'Todos os leitores recebem a mesma navegação, mesmo quando há conteúdos relevantes para seu território.',
    jeo: 'Funcionalidades como Histórias perto de mim abrem caminho para experiências mais próximas do lugar de interesse do leitor.',
  },
]

function ComparePair({ now, jeo }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Atualmente */}
      <div className="rounded-lg border border-white/5 bg-card-dark p-5 transition-colors duration-300 hover:border-white/15">
        <span className="text-sm font-medium text-muted-2">Atualmente</span>
        <p className="mt-3 text-sm leading-relaxed text-muted">{now}</p>
      </div>
      {/* Com JEO BRAINS */}
      <div className="group relative overflow-hidden rounded-lg border border-brand/50 bg-brand-darkest/40 p-5 transition-all duration-300 hover:border-brand/80 hover:shadow-glow-brand">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="relative text-sm font-medium text-brand">
          Com <span className="font-bold text-white">JEO</span> BRAINS
        </span>
        <p className="relative mt-3 text-sm leading-relaxed text-slate-300">{jeo}</p>
      </div>
    </div>
  )
}

export default function WhySection() {
  return (
    <section id="por-que" className="relative bg-base py-24 sm:py-28">
      <div className="section-shell grid items-start gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        {/* Heading — sticky on desktop so it frames the cards column as it scrolls.
            Sticky lives on the grid item (not the animated Reveal) so the entrance
            transform doesn't fight the sticky offset. */}
        <div className="lg:sticky lg:top-24">
          <Reveal>
            <h2 className="font-condensed font-display text-4xl font-extrabold uppercase leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-right">
              Como a{' '}
              <span className="text-brand">inteligência geográfica</span> pode
              beneficiar a minha redação?
            </h2>
          </Reveal>
        </div>

        {/* Pain points */}
        <div className="flex flex-col gap-10">
          {PAINS.map((p, i) => (
            <Reveal key={p.title} delay={(i % 2) * 0.08}>
              <h3 className="mb-4 flex items-center gap-2 font-condensed font-display text-xl font-bold uppercase tracking-wide text-brand">
                <span aria-hidden="true">→</span>
                {p.title}
              </h3>
              <ComparePair now={p.now} jeo={p.jeo} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
