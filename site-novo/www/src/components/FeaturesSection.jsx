import { motion } from 'framer-motion'
import { LocateFixed, SlidersHorizontal, Database, Layers, PlayCircle, FileText } from 'lucide-react'
import Reveal from './ui/Reveal.jsx'

const FEATURES = [
  {
    icon: LocateFixed,
    title: 'Georreferenciamento autônomo',
    subtitle: 'Extração geográfica automatizada por IA',
    body: 'Escreva sua reportagem normalmente. Nossa IA lê o texto em tempo real, identifica menções a localidades, ruas, cidades ou coordenadas e sugere automaticamente a plotagem correta no mapa.',
    highlight: 'Economize até 80% do tempo de inserção manual de dados.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Human-in-the-loop',
    tag: '(Humano no circuito)',
    subtitle: 'Controle editorial total e IA assistida',
    body: 'A tecnologia apoia, mas a decisão final é sempre sua. Interface intuitiva de revisão onde jornalistas e editores validam, refinam e editam as marcações sugeridas pela IA antes da publicação.',
    highlight: 'Precisão jornalística combinada com automação tecnológica.',
  },
  {
    icon: Database,
    title: 'Base de conhecimento RAG',
    tag: '(Retrieval-Augmented Generation)',
    subtitle: 'Contextualização profunda com dados históricos',
    body: 'Conecte o JEO às suas próprias bases de dados, relatórios antigos ou acervos públicos. A IA utiliza essa base de conhecimento especializada para enriquecer as novas reportagens com cruzamentos históricos precisos.',
    highlight: 'Checagem e profundidade baseadas no seu próprio repositório confiável.',
  },
  {
    icon: Layers,
    title: 'Contextualização automatizada de termos',
    tag: '(Múltiplos renderizadores)',
    subtitle: 'Flexibilidade visual para qualquer narrativa',
    body: 'Escolha como sua história deve ser contada. Alterne facilmente entre diferentes estilos de visualização: mapas de calor (heatmaps), clusters de pontos, linhas de tempo geográficas ou polígonos de dados socioambientais.',
    highlight: 'Mapbox, OpenStreetMap e múltiplos layouts integrados.',
  },
]

function FeatureCard({ feature, index }) {
  const Icon = feature.icon
  return (
    <Reveal delay={(index % 2) * 0.1} className="h-full">
      <motion.article
        whileHover={{ y: -6 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-brand/25 bg-card-teal/80 p-7 shadow-card"
      >
        {/* top accent bar */}
        <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand to-transparent opacity-60" />
        {/* hover sheen */}
        <div className="pointer-events-none absolute -inset-px bg-gradient-to-br from-brand/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <div className="relative">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-brand/15 text-brand ring-1 ring-brand/30 transition-all duration-300 group-hover:bg-brand/25 group-hover:text-brand-light">
            <Icon className="h-6 w-6" />
          </span>

          <h3 className="mt-6 font-display text-xl font-bold uppercase leading-tight tracking-wide text-brand-light">
            {feature.title}
            {feature.tag && (
              <span className="mt-1 block text-sm font-semibold text-brand/70">
                {feature.tag}
              </span>
            )}
          </h3>

          <p className="mt-4 font-semibold text-white">{feature.subtitle}</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">{feature.body}</p>
          <p className="mt-5 text-sm font-medium leading-relaxed text-brand-light/90">
            {feature.highlight}
          </p>
        </div>

        <div className="relative mt-7 flex flex-wrap gap-3 pt-1">
          <a
            href="#tutoriais"
            className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-xs font-semibold text-ink transition-all duration-300 hover:bg-brand-light hover:shadow-glow-brand"
          >
            <PlayCircle className="h-4 w-4" />
            Vídeo tutorial
          </a>
          <a
            href="#tutoriais"
            className="inline-flex items-center gap-2 rounded-md border border-white/15 px-4 py-2 text-xs font-semibold text-slate-200 transition-all duration-300 hover:border-brand/60 hover:bg-brand/10 hover:text-white"
          >
            <FileText className="h-4 w-4" />
            Tutorial em PDF
          </a>
        </div>
      </motion.article>
    </Reveal>
  )
}

export default function FeaturesSection() {
  return (
    <section id="recursos" className="relative bg-base py-24 sm:py-28">
      <div className="section-shell">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-extrabold uppercase leading-tight tracking-tight text-white sm:text-4xl">
            <span className="text-brand">Recursos inteligentes</span> para
            <br className="hidden sm:block" /> potencializar suas coberturas
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
