import DefaultTheme from 'vitepress/theme'
import TranslationPendingPT from './TranslationPendingPT.vue'
import TranslationPendingES from './TranslationPendingES.vue'
import '@fontsource-variable/open-sans'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Per-locale marker components injected by scripts/docs-sync.mjs into
    // pages that still lack a translation (one component per locale).
    app.component('TranslationPendingPT', TranslationPendingPT)
    app.component('TranslationPendingES', TranslationPendingES)
  },
}
