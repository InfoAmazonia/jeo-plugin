// External destinations shared across sections (all opened in a new tab).
export const DOWNLOAD_URL = 'https://wordpress.org/plugins/jeowp/'
export const GITHUB_URL = 'https://github.com/InfoAmazonia/jeo-plugin/'

// Docs are served under /docs/<locale>/ (VitePress locales; English at the
// root). Each landing language links to its docs counterpart.
const DOCS_LOCALES = { en: '', 'pt-BR': '/pt', es: '/es' }
export const docsUrl = (lang) => {
  const path = DOCS_LOCALES[lang] ?? DOCS_LOCALES.en
  return path ? `/docs${path}/` : '/docs/'
}
