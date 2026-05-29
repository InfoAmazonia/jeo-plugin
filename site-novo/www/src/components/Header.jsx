import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import JeoMark from './ui/JeoMark.jsx'
import jeoWordmark from '../assets/jeo-wordmark.svg'
import { DOWNLOAD_URL } from '../links.js'

const NAV = [
  { label: 'Brains', href: '#top' },
  { label: 'Theme', href: '#recursos' },
  { label: 'Plugin', href: '#integracao' },
]

export default function Header() {
  const reduce = useReducedMotion()
  const [visible, setVisible] = useState(false)
  const [activeId, setActiveId] = useState('#top')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.5)
      // Scroll spy: the active link is the last section scrolled near the top.
      let current = NAV[0].href
      for (const { href } of NAV) {
        const el = document.querySelector(href)
        if (el && el.getBoundingClientRect().top <= 140) current = href
      }
      setActiveId(current)
    }
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
          <img src={jeoWordmark} alt="JEO" className="h-6 w-auto" />
          <span className="hidden text-sm text-muted-2 sm:inline">
            Geojournalism Platform
          </span>
        </a>

        {/* Nav */}
        <nav className="flex items-center gap-6 sm:gap-10">
          <div className="hidden items-center gap-7 sm:flex lg:gap-9">
            {NAV.map((n) => {
              const active = activeId === n.href
              return (
                <a
                  key={n.label}
                  href={n.href}
                  aria-current={active ? 'true' : undefined}
                  className={`group relative pb-1 text-sm font-semibold uppercase tracking-wide transition-colors ${
                    active ? 'text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {n.label}
                  <span
                    className={`absolute -bottom-0.5 left-0 h-0.5 bg-brand transition-all duration-300 ${
                      active ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </a>
              )
            })}
          </div>
          <a
            href={DOWNLOAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-md bg-brand/90 px-5 py-2.5 text-sm font-semibold text-ink transition-all duration-300 hover:bg-brand hover:shadow-glow-brand sm:inline-flex"
          >
            Install free
          </a>
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-200 transition-colors hover:bg-white/10 hover:text-white sm:hidden"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-white/5 sm:hidden"
          >
            <div className="section-shell flex flex-col gap-1 py-4">
              {NAV.map((n) => {
                const active = activeId === n.href
                return (
                  <a
                    key={n.label}
                    href={n.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active ? 'true' : undefined}
                    className={`rounded-md px-3 py-3 text-sm font-semibold uppercase tracking-wide transition-colors ${
                      active
                        ? 'bg-brand/10 text-white'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {n.label}
                  </a>
                )
              })}
              <a
                href={DOWNLOAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="mt-2 rounded-md bg-brand/90 px-3 py-3 text-center text-sm font-semibold text-ink transition-all duration-300 hover:bg-brand"
              >
                Install free
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
