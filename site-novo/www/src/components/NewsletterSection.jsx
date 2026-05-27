import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Send, PartyPopper } from 'lucide-react'
import Reveal from './ui/Reveal.jsx'

function Checkbox({ label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="group flex items-center gap-3 text-left"
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all duration-200 ${
          checked
            ? 'border-brand bg-brand text-ink'
            : 'border-white/30 bg-transparent group-hover:border-brand/70'
        }`}
      >
        <AnimatePresence>
          {checked && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <span className="text-sm text-slate-300">{label}</span>
    </button>
  )
}

export default function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [opts, setOpts] = useState({ a: true, b: false })
  const [sent, setSent] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!email) return
    setSent(true)
  }

  return (
    <section id="comunidade" className="bg-base py-24 sm:py-28">
      <div className="section-shell grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
        {/* Left copy */}
        <Reveal>
          <h2 className="font-display text-3xl font-extrabold uppercase leading-[1.1] tracking-tight text-white sm:text-4xl">
            Receba acesso à comunidade e{' '}
            <span className="text-brand">convites antecipados</span> para
            participar das oficinas
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-slate-400">
            Nossas oficinas são o melhor caminho para uma excelente utilização
            da ferramenta. Informe seu email para se manter em dia com as
            novidades.
          </p>
        </Reveal>

        {/* Right form */}
        <Reveal delay={0.1}>
          <p className="text-sm leading-relaxed text-slate-400">
            Digite seu e-mail para receber as credenciais do ambiente de testes
            e atualizações sobre o desenvolvimento.
          </p>

          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex items-center gap-3 rounded-lg border border-brand/40 bg-card-teal p-5 text-brand-light"
              >
                <PartyPopper className="h-5 w-5" />
                <span className="text-sm font-medium text-slate-200">
                  Inscrição confirmada! Em breve você receberá novidades em{' '}
                  <strong className="text-white">{email}</strong>.
                </span>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                exit={{ opacity: 0 }}
                className="mt-6"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  aria-label="Seu e-mail"
                  className="w-full rounded-md border-2 border-brand/60 bg-transparent px-4 py-4 text-slate-100 placeholder:text-slate-600 transition-all duration-300 focus:border-brand focus:shadow-glow-brand focus:outline-none"
                />

                <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-3">
                    <Checkbox
                      label="Lorem ipsum sit amet"
                      checked={opts.a}
                      onChange={() => setOpts((o) => ({ ...o, a: !o.a }))}
                    />
                    <Checkbox
                      label="Ipsum lorem ipsum sit amet"
                      checked={opts.b}
                      onChange={() => setOpts((o) => ({ ...o, b: !o.b }))}
                    />
                  </div>

                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.96 }}
                    className="btn-brand group shrink-0"
                  >
                    Inscrever-se
                    <Send className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
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
