import { motion, useReducedMotion } from 'framer-motion'
import Reveal from './ui/Reveal.jsx'
import EditorMock from './ui/EditorMock.jsx'

export default function ReadySection() {
  const reduce = useReducedMotion()

  return (
    <section id="tudo-pronto" className="relative overflow-hidden bg-base py-24 sm:py-28">
      <div className="section-shell grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
        {/* Editor mockup */}
        <Reveal y={40} className="order-2 lg:order-1">
          <motion.div
            animate={reduce ? {} : { y: [0, -12, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            className="relative"
          >
            <div className="pointer-events-none absolute -inset-6 -z-10 rounded-3xl bg-brand/10 blur-3xl" />
            <EditorMock />
          </motion.div>
        </Reveal>

        {/* Copy */}
        <div className="order-1 lg:order-2">
          <Reveal>
            <h2 className="font-display text-4xl font-extrabold uppercase leading-[1.05] tracking-tight text-white sm:text-5xl">
              Tudo pronto para{' '}
              <span className="bg-gradient-to-r from-brand to-brand-light bg-clip-text text-transparent">
                transformar
              </span>{' '}
              suas reportagens?
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-400">
              Lorem ipsum dolor sit amet consectetur. In nibh dolor semper amet
              semper urna nunc hac. Iaculis pellentesque et faucibus volutpat. At
              porta at id diam mi imperdiet enim arcu. Amet sit ac netus at massa
              consectetur nam. Proin quam leo viverra.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
