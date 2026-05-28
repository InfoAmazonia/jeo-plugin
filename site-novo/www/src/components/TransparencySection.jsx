import { motion } from 'framer-motion'
import { Github, Terminal, ShieldQuestion } from 'lucide-react'
import Reveal from './ui/Reveal.jsx'

const LINKS = [
  { icon: Github, label: 'Repositório no GitHub', href: '#github' },
  { icon: Terminal, label: 'Documentação Técnica', href: '#docs' },
  { icon: ShieldQuestion, label: 'Privacidade e LGPD', href: '#lgpd' },
]

export default function TransparencySection() {
  return (
    <section id="transparencia" className="bg-base pb-28 pt-4">
      <div className="section-shell grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
        {/* Action links */}
        <Reveal className="order-2 lg:order-1">
          <div className="flex flex-col gap-5">
            {LINKS.map((l, i) => {
              const Icon = l.icon
              return (
                <motion.a
                  key={l.label}
                  href={l.href}
                  whileHover={{ x: 6 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                  className="group flex items-center justify-center gap-3 rounded-lg border border-brand/50 bg-brand-darkest/20 px-6 py-5 transition-all duration-300 hover:border-brand hover:bg-brand-darkest/50 hover:shadow-glow-brand"
                  style={{ transitionDelay: `${i * 40}ms` }}
                >
                  <Icon className="h-5 w-5 text-brand transition-colors duration-300 group-hover:text-brand-light" />
                  <span className="font-semibold text-slate-100 group-hover:text-white">
                    {l.label}
                  </span>
                </motion.a>
              )
            })}
          </div>
        </Reveal>

        {/* Copy */}
        <div className="order-1 lg:order-2">
          <Reveal>
            <h2 className="font-display text-4xl font-extrabold uppercase leading-[1.05] tracking-tight text-white sm:text-5xl">
              Transparência, autonomia e código aberto
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted">
              O <strong className="font-semibold text-white">JEO</strong> é uma
              tecnologia{' '}
              <strong className="font-semibold text-brand-light">
                100% open-source
              </strong>
              . Acreditamos que as ferramentas que sustentam o jornalismo
              independente e a investigação de dados devem ser{' '}
              <strong className="font-semibold text-brand-light">
                públicas, auditáveis e livres para modificação
              </strong>
              . Junte-se a nós no GitHub para contribuir com o código, reportar
              melhorias ou adaptar a ferramenta para a sua realidade.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-2">
              O uso do plugin é gratuito. Algumas integrações, como serviços de
              mapas ou IA, podem exigir chaves próprias e custos externos
              conforme a configuração de cada organização.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
