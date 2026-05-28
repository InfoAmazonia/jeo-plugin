import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, PartyPopper } from 'lucide-react'
import Reveal from './ui/Reveal.jsx'

const OPTIONS = [
  { id: 'test', label: 'Quero testar o plugin em uma redação ou organização.', default: true },
  { id: 'workshops', label: 'Quero participar das oficinas.', default: false },
  { id: 'docs', label: 'Quero receber documentação e atualizações.', default: true },
  { id: 'contribute', label: 'Tenho interesse em contribuir tecnicamente.', default: false },
]

function Checkbox({ label, checked, onChange }) {
  return (
    <button type="button" onClick={onChange} className="group flex items-center gap-3 text-left">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all duration-200 ${
          checked
            ? 'border-brand bg-brand text-ink'
            : 'border-brand/60 bg-transparent group-hover:border-brand'
        }`}
      >
        <AnimatePresence>
          {checked && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <span className="text-sm text-slate-200">{label}</span>
    </button>
  )
}

export default function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [opts, setOpts] = useState(() =>
    Object.fromEntries(OPTIONS.map((o) => [o.id, o.default])),
  )
  const [sent, setSent] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!email) return
    setSent(true)
  }

  return (
    <section id="comunidade" className="bg-base py-24 sm:py-28">
      <div className="section-shell grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        {/* Left copy */}
        <Reveal>
          <h2 className="font-display text-4xl font-extrabold uppercase leading-[1.08] tracking-tight text-white sm:text-5xl">
            <span className="text-brand">Receba acesso</span> ao ambiente de
            testes e às oficinas
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-slate-300">
            Nossas oficinas são o melhor caminho para uma excelente utilização
            da ferramenta. Informe seu email para se manter em dia com as
            novidades.
          </p>
        </Reveal>

        {/* Right form */}
        <Reveal delay={0.1}>
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 rounded-lg border border-brand/40 bg-brand-darkest/40 p-5 text-brand-light"
              >
                <PartyPopper className="h-5 w-5" />
                <span className="text-sm font-medium text-slate-200">
                  Inscrição confirmada! Em breve você receberá novidades em{' '}
                  <strong className="text-white">{email}</strong>.
                </span>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={handleSubmit} exit={{ opacity: 0 }}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Informe seu e-mail para conhecer o JEO BRAINS"
                  aria-label="Seu e-mail"
                  className="w-full rounded-lg border-2 border-brand/60 bg-transparent px-5 py-4 text-slate-100 placeholder:text-slate-500 transition-all duration-300 focus:border-brand focus:shadow-glow-brand focus:outline-none"
                />

                <div className="mt-6 flex flex-col gap-3">
                  {OPTIONS.map((o) => (
                    <Checkbox
                      key={o.id}
                      label={o.label}
                      checked={opts[o.id]}
                      onChange={() => setOpts((s) => ({ ...s, [o.id]: !s[o.id] }))}
                    />
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <motion.button type="submit" whileTap={{ scale: 0.96 }} className="btn-brand">
                    Inscrever-se
                  </motion.button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </Reveal>
      </div>
    </section>
  )
}
