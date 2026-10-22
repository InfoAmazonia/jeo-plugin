import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Cookie } from 'lucide-react'
import { useI18n } from '../i18n/index.jsx'

const STORAGE_KEY = 'jeo-consent-v1'

/**
 * Cookie/terms consent notice (first visit only). Restyled for the v3
 * design system: navy surface, mint accent, v3 button styling. The text
 * is fully translated (i18n `consent.*`).
 *
 * Positioning: bottom-left. On desktop it sits at `sm:bottom-24` so it
 * clears the 64px footer bottom bar (where the terms-of-use trigger
 * lives) instead of covering it while visible; on mobile it keeps the
 * standard `bottom-4` (the stacked footer is transient there — the
 * banner is dismissed once and never returns).
 */
export default function ConsentBanner() {
  const reduce = useReducedMotion()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  // Show only on first visit (no stored preference).
  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true)
    } catch {
      setOpen(true)
    }
  }, [])

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'accepted')
    } catch {
      /* storage unavailable — just dismiss for this session */
    }
    setOpen(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-xl border border-white/10 bg-v3-navy/95 p-4 shadow-card backdrop-blur-md sm:inset-x-auto sm:bottom-24 sm:left-6"
          role="dialog"
          aria-live="polite"
          aria-label={t.consent.label}
        >
          <div className="flex items-start gap-3">
            <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-v3-green" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-sm leading-relaxed text-v3-light">
                {t.consent.body}{' '}
                <span className="font-semibold text-v3-green">{t.consent.terms}</span>{' '}
                {t.consent.tail}
              </p>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={accept}
                  className="rounded-lg bg-v3-green px-5 py-2 text-sm font-bold text-v3-navy transition-all duration-300 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-v3-green focus-visible:ring-offset-2 focus-visible:ring-offset-v3-navy"
                >
                  {t.consent.accept}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
