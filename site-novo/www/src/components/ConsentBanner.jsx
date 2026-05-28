import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Cookie } from 'lucide-react'

const STORAGE_KEY = 'jeo-consent-v1'

export default function ConsentBanner() {
  const reduce = useReducedMotion()
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
          className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-xl border border-white/10 bg-panel/95 p-4 shadow-card backdrop-blur-md sm:inset-x-auto sm:left-6"
          role="dialog"
          aria-live="polite"
          aria-label="Aviso de cookies e termos de uso"
        >
          <div className="flex items-start gap-3">
            <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-sm leading-relaxed text-slate-200">
                Usamos cookies para melhorar sua experiência. Ao continuar
                navegando, você concorda com os nossos{' '}
                <span className="font-semibold text-brand-light">
                  termos de uso
                </span>{' '}
                e com o uso de cookies.
              </p>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={accept}
                  className="rounded-md bg-brand px-5 py-2 text-xs font-semibold text-ink transition-all duration-300 hover:bg-brand-light hover:shadow-glow-brand"
                >
                  Aceitar
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
