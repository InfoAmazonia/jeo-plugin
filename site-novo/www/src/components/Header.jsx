import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Menu, X, Globe, ChevronDown } from 'lucide-react'
import { useI18n, LANGUAGES } from '../i18n/index.jsx'
import wordmark from '../assets/v3-jeo-maps-wordmark.png'
import { DOWNLOAD_URL } from '../links.js'

const ANCHORS = ['#top', '#recursos', '#inteligencia-artificial', '#experimente']

const LANGUAGE_LABELS = { 'pt-BR': 'Português', en: 'English' }

function LanguageSwitcher({ className = '', onSelect }) {
  const { lang, setLang, t } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t.nav.language}
        className="flex items-center gap-1 rounded-md p-1.5 text-v3-light/90 transition-colors hover:text-v3-light focus:outline-none focus-visible:ring-2 focus-visible:ring-v3-green"
      >
        <Globe className="h-6 w-6" strokeWidth={1.75} />
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label={t.nav.language}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 min-w-[10rem] overflow-hidden rounded-lg border border-white/10 bg-v3-navy py-1 shadow-card"
          >
            {LANGUAGES.map(({ code, short }) => (
              <li key={code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={lang === code}
                  onClick={() => {
                    setLang(code)
                    setOpen(false)
                    onSelect?.()
                  }}
                  className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold transition-colors ${
                    lang === code
                      ? 'bg-v3-green/10 text-v3-green'
                      : 'text-v3-light/90 hover:bg-white/5 hover:text-v3-light'
                  }`}
                >
                  {short} — {LANGUAGE_LABELS[code]}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Header() {
  const reduce = useReducedMotion()
  const { t } = useI18n()
  const [activeId, setActiveId] = useState('#top')
  const [menuOpen, setMenuOpen] = useState(false)

  const NAV = [
    { label: t.nav.home, href: '#top' },
    { label: t.nav.features, href: '#recursos' },
    { label: t.nav.ai, href: '#inteligencia-artificial' },
    { label: t.nav.try, href: '#experimente' },
  ]

  // Scroll spy: the active link is the last section scrolled near the top.
  useEffect(() => {
    const onScroll = () => {
      let current = ANCHORS[0]
      for (const href of ANCHORS) {
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
    <header className="sticky inset-x-0 top-0 z-40 bg-v3-navy">
      <div className="section-shell-v3 flex h-16 items-center justify-between gap-4 lg:h-[118px]">
        {/* Wordmark */}
        <a href="#top" className="flex shrink-0 items-center">
          <img
            src={wordmark}
            alt="JEO Maps"
            className="h-10 w-auto lg:h-[70px]"
          />
        </a>

        {/* Nav links (desktop) */}
        <nav className="hidden items-center gap-8 lg:flex xl:gap-14">
          {NAV.map((n) => {
            const active = activeId === n.href
            return (
              <a
                key={n.href}
                href={n.href}
                aria-current={active ? 'true' : undefined}
                className={`group relative py-1 text-base font-bold transition-colors xl:text-xl ${
                  active
                    ? 'text-v3-light'
                    : 'text-v3-light/90 hover:text-v3-light'
                }`}
              >
                {n.label}
                <span
                  className={`absolute -bottom-0.5 left-0 h-0.5 bg-v3-green transition-all duration-300 ${
                    active ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
              </a>
            )
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 lg:gap-5">
          <a
            href={DOWNLOAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-v3-primary hidden h-[59px] px-6 lg:inline-flex"
          >
            {t.nav.cta}
          </a>
          <LanguageSwitcher className="hidden lg:block" />
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu}
            aria-expanded={menuOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-v3-light transition-colors hover:bg-white/10 lg:hidden"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-white/5 lg:hidden"
          >
            <div className="section-shell-v3 flex flex-col gap-1 py-4">
              {NAV.map((n) => {
                const active = activeId === n.href
                return (
                  <a
                    key={n.href}
                    href={n.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active ? 'true' : undefined}
                    className={`rounded-md px-3 py-3 text-base font-bold transition-colors ${
                      active
                        ? 'bg-v3-green/10 text-v3-light'
                        : 'text-v3-light/90 hover:bg-white/5 hover:text-v3-light'
                    }`}
                  >
                    {n.label}
                  </a>
                )
              })}
              <div className="mt-2 flex items-center justify-between gap-3">
                <a
                  href={DOWNLOAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="btn-v3-primary h-12 flex-1 text-base"
                >
                  {t.nav.cta}
                </a>
                <LanguageSwitcher onSelect={() => setMenuOpen(false)} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
