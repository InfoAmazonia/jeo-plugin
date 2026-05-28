import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import JeoMark from './ui/JeoMark.jsx'

const NAV = [
  { label: 'Brains', href: '#top', active: true },
  { label: 'Theme', href: '#recursos' },
  { label: 'Plugin', href: '#integracao' },
]

export default function Header() {
  const reduce = useReducedMotion()
  const [visible, setVisible] = useState(false)

  // Reveal once the page is scrolled past ~50% of the hero (≈ half the viewport)
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.5)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={false}
      animate={{ y: visible ? '0%' : '-100%' }}
      transition={
        reduce
          ? { duration: 0 }
          : { type: 'spring', stiffness: 260, damping: 30 }
      }
      className={`fixed inset-x-0 top-0 z-40 border-b border-white/5 bg-base/95 backdrop-blur-md ${
        visible ? '' : 'pointer-events-none'
      }`}
    >
      <div className="section-shell flex items-center justify-between py-3">
        {/* Logo lockup */}
        <a href="#top" className="flex items-center gap-3">
          <JeoMark className="h-9 w-auto" />
          <span className="font-display text-2xl font-bold uppercase tracking-tight text-white">
            JEO
          </span>
          <span className="hidden text-sm text-muted-2 sm:inline">
            Geojournalism Platform
          </span>
        </a>

        {/* Nav */}
        <nav className="flex items-center gap-6 sm:gap-10">
          <div className="hidden items-center gap-7 sm:flex lg:gap-9">
            {NAV.map((n) => (
              <a
                key={n.label}
                href={n.href}
                className={`text-sm font-semibold uppercase tracking-wide transition-colors ${
                  n.active
                    ? 'border-b-2 border-brand pb-0.5 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {n.label}
              </a>
            ))}
          </div>
          <a
            href="#download"
            className="rounded-md bg-brand/90 px-5 py-2.5 text-sm font-semibold text-ink transition-all duration-300 hover:bg-brand hover:shadow-glow-brand"
          >
            Install free
          </a>
        </nav>
      </div>
    </motion.header>
  )
}
