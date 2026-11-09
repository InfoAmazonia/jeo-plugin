import DefaultTheme from 'vitepress/theme'
import TranslationPendingPT from './TranslationPendingPT.vue'
import '@fontsource-variable/open-sans'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Per-locale marker component injected by scripts/docs-pt-sync.mjs into
    // pages that still lack a pt-BR translation (future locales, e.g. es,
    // get their own component + sync script).
    app.component('TranslationPendingPT', TranslationPendingPT)
  },
}
