import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import ptBR from './pt-BR.js'
import en from './en.js'
import es from './es.js'

export const LANGUAGES = [
  { code: 'pt-BR', short: 'PT' },
  { code: 'en', short: 'EN' },
  { code: 'es', short: 'ES' },
]

const DICTIONARIES = { 'pt-BR': ptBR, en, es }
const STORAGE_KEY = 'jeo-lang'
const DEFAULT_LANG = 'pt-BR'

const I18nContext = createContext(null)

function readInitialLang() {
  try {
    // Locale-aware deep links (e.g. the docs site logo links here with the
    // reader's locale): ?lang=xx wins over the stored preference and is
    // persisted so the choice survives subsequent visits.
    const param = new URLSearchParams(window.location.search).get('lang')
    if (param && DICTIONARIES[param]) {
      window.localStorage.setItem(STORAGE_KEY, param)
      return param
    }
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved && DICTIONARIES[saved]) return saved
  } catch {
    /* localStorage unavailable */
  }
  return DEFAULT_LANG
}

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(readInitialLang)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      /* localStorage unavailable */
    }
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo(
    () => ({ lang, setLang, t: DICTIONARIES[lang] }),
    [lang],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
