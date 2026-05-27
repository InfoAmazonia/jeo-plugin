import Reveal from './ui/Reveal.jsx'

const COMPARISONS = [
  {
    title: 'Complexidade técnica',
    now: 'Cruzar bancos de dados complexos com mapas analíticos exige equipes de desenvolvimento dedicadas e horas de trabalho.',
    jeo: 'Automatiza a ponte entre o texto jornalístico e as coordenadas geográficas diretamente no editor do WordPress.',
  },
  {
    title: 'Falta de contexto visual',
    now: 'Notícias locais muitas vezes perdem o impacto porque a audiência não consegue visualizar a dimensão espacial dos acontecimentos.',
    jeo: 'Transforma dados abstratos em camadas visuais e interativas que dão profundidade e contexto imediato à narrativa.',
  },
]

function ComparePair({ now, jeo }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Atualmente */}
      <div className="rounded-lg border border-white/10 bg-card-dark/70 p-5 transition-colors duration-300 hover:border-white/20">
        <span className="text-sm font-medium text-slate-500">Atualmente</span>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">{now}</p>
      </div>
      {/* Com JEO BRAINS */}
      <div className="group relative overflow-hidden rounded-lg border border-brand/40 bg-card-teal p-5 transition-all duration-300 hover:border-brand/70 hover:shadow-glow-brand">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="relative text-sm font-medium text-brand-light">
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
      <div className="section-shell grid items-start gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        {/* Heading */}
        <Reveal>
          <h2 className="font-display text-4xl font-extrabold uppercase leading-[1.05] tracking-tight text-white sm:text-5xl">
            Por que o<br />
            jornalismo de<br />
            dados precisa de{' '}
            <span className="bg-gradient-to-r from-brand to-brand-light bg-clip-text text-transparent">
              inteligência geográfica?
            </span>
          </h2>
        </Reveal>

        {/* Comparison cards */}
        <div className="flex flex-col gap-10">
          {COMPARISONS.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.1}>
              <h3 className="mb-4 font-display text-xl font-bold uppercase tracking-wide text-brand">
                {c.title}
              </h3>
              <ComparePair now={c.now} jeo={c.jeo} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
