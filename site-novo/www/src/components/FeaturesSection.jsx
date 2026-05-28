import { motion } from 'framer-motion'
import { MapPin, Map, Recycle, Sparkles, Navigation, PlayCircle, FileText } from 'lucide-react'
import Reveal from './ui/Reveal.jsx'
import ParallaxImage from './ui/ParallaxImage.jsx'
import featuresBg from '../assets/features-bg.jpg'

const FEATURES = [
  {
    icon: MapPin,
    title: 'Geolocalização assistida por IA',
    subtitle: 'A base para mapas, recomendações e contexto',
    body: 'O sistema analisa reportagens novas e antigas, identifica lugares mencionados e sugere localizações primárias e secundárias no WordPress. Editores revisam e aprovam antes da publicação.',
  },
  {
    icon: Map,
    title: 'Mini-mapas por reportagem',
    subtitle: 'Mostre onde a história acontece',
    body: 'Inclua mapas diretamente nas matérias, com pontos, áreas ou camadas temáticas relacionadas ao conteúdo. A ferramenta ajuda a transformar localização em contexto visual para o leitor e ainda possibilita que ele navegue por outras reportagens sobre o mesmo território.',
  },
  {
    icon: Recycle,
    title: 'Leia Também inteligente',
    subtitle: 'Melhore a experiência do leitor e recircule seu acervo',
    body: 'Recomende outras reportagens a partir da combinação entre tema e proximidade geográfica. Uma matéria sobre mineração no Amapá pode levar o leitor a outras coberturas sobre mineração na mesma região ou em territórios relacionados.',
  },
  {
    icon: Sparkles,
    title: 'Contexto adicional por IA',
    subtitle: 'Mais contexto, com revisão editorial',
    body: 'A partir do acervo da redação, a IA sugere parágrafos curtos de contexto sobre o tema da reportagem. O editor revisa, ajusta e publica apenas o que fizer sentido. Utilize a memória editorial da sua redação com mais frequência e eficácia.',
  },
  {
    icon: Navigation,
    title: 'Histórias perto de mim',
    subtitle: 'Personalização da experiência do leitor por território',
    body: 'Organize reportagens por localidade e permita que leitores encontrem conteúdos relacionados a seus territórios de interesse. A funcionalidade pode ser usada como página própria, aba ou experiência dentro de uma página já existente em seu site.',
  },
]

function FeatureCard({ feature, index }) {
  const Icon = feature.icon
  return (
    <Reveal delay={(index % 2) * 0.1} className="h-full">
      <motion.article
        whileHover={{ y: -6 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-brand/20 bg-brand-darkest/30 p-7 shadow-card backdrop-blur-sm"
      >
        {/* top accent bar */}
        <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand to-transparent opacity-60" />
        {/* hover sheen */}
        <div className="pointer-events-none absolute -inset-px bg-gradient-to-br from-brand/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <div className="relative flex-1">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-brand/15 text-brand ring-1 ring-brand/30 transition-all duration-300 group-hover:bg-brand/25 group-hover:text-brand-light">
            <Icon className="h-6 w-6" />
          </span>

          <h3 className="mt-6 font-display text-xl font-bold uppercase leading-tight tracking-wide text-brand">
            {feature.title}
          </h3>

          <p className="mt-4 font-semibold text-white">{feature.subtitle}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">{feature.body}</p>
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
    <section id="recursos" className="relative overflow-hidden bg-base py-24 sm:py-28">
      {/* Subtle topographic texture (Figma / Freepik asset) */}
      {/* Topographic texture with pointer parallax + motion afterimage (subtle) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.08] [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_70%,transparent)]"
      >
        <ParallaxImage
          src={featuresBg}
          range={22}
          scale={1.15}
          trailScale={1.24}
          trailOpacity={0.55}
          className="absolute inset-0 h-full w-full"
        />
      </div>

      <div className="section-shell relative z-10">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-extrabold uppercase leading-tight tracking-tight text-white sm:text-4xl">
            Recursos <span className="text-brand">inteligentes</span> para
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
