import { defineConfig } from 'vitepress'

// Bilingual docs (en + pt-BR) via VitePress locales:
// - English stays at the root (`/getting-started/`)
// - Portuguese lives under `docs/pt/` (`/pt/getting-started/`)
// Internal links inside pages are relative `.md` links, so pt pages link to
// their pt siblings automatically. Images live in `docs/img/` and must gain
// one extra `../` level from pt pages. Pages without a translation are kept
// as English copies with a banner — see `scripts/docs-pt-sync.mjs`.
// UI terminology follows the plugin's pt_BR catalog (src/languages/).

export default defineConfig({
  title: 'JEO Maps',
  description:
    'Open geojournalism platform for WordPress: publish news stories as layers of information on interactive maps.',

  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/' },
          {
            text: 'Plugin',
            items: [
              { text: 'Overview', link: '/index-plugin/' },
              { text: 'Concepts', link: '/concepts/' },
              { text: 'Getting started', link: '/getting-started/' },
              { text: 'Layers', link: '/layer-post/' },
              { text: 'Maps', link: '/map-post/' },
              { text: 'Discovery', link: '/discovery/' },
              { text: 'Story map', link: '/story-map/' },
              { text: 'Stories near you', link: '/stories-near-you/' },
              { text: 'Minimap', link: '/minimap/' },
              { text: 'Map shortcode', link: '/map-shortcode/' },
              { text: 'Map block', link: '/map-block/' },
              { text: 'One-time map block', link: '/one-time-map-block/' },
              { text: 'Map embed', link: '/map-embed/' },
              { text: 'Geolocating posts', link: '/geolocating-posts/' },
            ],
          },
          {
            text: 'AI',
            items: [
              { text: 'AI in JEO', link: '/ai-in-jeo/' },
              { text: 'AI Settings', link: '/ai-settings/' },
              { text: 'AI Context Assistant', link: '/ai-context-assistant/' },
              { text: 'AI Georeferencing', link: '/ai-georeferencing/' },
              { text: 'AI Bulk Geolocation', link: '/ai-bulk-geolocation/' },
            ],
          },
          {
            text: 'Developer',
            items: [
              { text: 'Geo information', link: '/dev/geo-information/' },
              { text: 'Geocoders', link: '/dev/geocoders/' },
              { text: 'Layer types', link: '/dev/layer-types/' },
              { text: 'Layer types API', link: '/dev/layer-types-api/' },
              { text: 'Migration', link: '/dev/migration/' },
              { text: 'PHP compatibility', link: '/dev/php-compatibility/' },
              { text: 'Dependency maintenance', link: '/dev/dependency-maintenance/' },
            ],
          },
          { text: 'Download', link: 'https://wordpress.org/plugins/jeowp/' },
        ],

        sidebar: [
          { text: 'Home', link: '/' },
          {
            text: 'Plugin',
            items: [
              { text: 'Overview', link: '/index-plugin/' },
              { text: 'Concepts', link: '/concepts/' },
              { text: 'Getting started', link: '/getting-started/' },
              { text: 'Layers', link: '/layer-post/' },
              { text: 'Maps', link: '/map-post/' },
              { text: 'Discovery', link: '/discovery/' },
              { text: 'Story map', link: '/story-map/' },
              { text: 'Stories near you', link: '/stories-near-you/' },
              { text: 'Minimap', link: '/minimap/' },
              { text: 'Map shortcode', link: '/map-shortcode/' },
              { text: 'Map block', link: '/map-block/' },
              { text: 'One-time map block', link: '/one-time-map-block/' },
              { text: 'Map embed', link: '/map-embed/' },
              { text: 'Geolocating posts', link: '/geolocating-posts/' },
            ],
          },
          {
            text: 'AI',
            items: [
              { text: 'AI in JEO', link: '/ai-in-jeo/' },
              { text: 'AI Settings', link: '/ai-settings/' },
              { text: 'AI Context Assistant', link: '/ai-context-assistant/' },
              { text: 'AI Georeferencing', link: '/ai-georeferencing/' },
              { text: 'AI Bulk Geolocation', link: '/ai-bulk-geolocation/' },
            ],
          },
          {
            text: 'Developer',
            items: [
              { text: 'Geo information', link: '/dev/geo-information/' },
              { text: 'Geocoders', link: '/dev/geocoders/' },
              { text: 'Layer types', link: '/dev/layer-types/' },
              { text: 'Layer types API', link: '/dev/layer-types-api/' },
              { text: 'Migration', link: '/dev/migration/' },
              { text: 'PHP compatibility', link: '/dev/php-compatibility/' },
              { text: 'Dependency maintenance', link: '/dev/dependency-maintenance/' },
            ],
          },
        ],
      },
    },

    pt: {
      label: 'Português (Brasil)',
      lang: 'pt-BR',
      description:
        'Plataforma de geojornalismo em código aberto para WordPress: publique histórias jornalísticas como camadas de informação em mapas interativos.',
      themeConfig: {
        nav: [
          { text: 'Início', link: '/pt/' },
          {
            text: 'Plugin',
            items: [
              { text: 'Visão geral', link: '/pt/index-plugin/' },
              { text: 'Conceitos', link: '/pt/concepts/' },
              { text: 'Primeiros passos', link: '/pt/getting-started/' },
              { text: 'Camadas', link: '/pt/layer-post/' },
              { text: 'Mapas', link: '/pt/map-post/' },
              { text: 'Discovery', link: '/pt/discovery/' },
              { text: 'Mapa narrativo', link: '/pt/story-map/' },
              { text: 'Histórias próximas a você', link: '/pt/stories-near-you/' },
              { text: 'Minimapa', link: '/pt/minimap/' },
              { text: 'Shortcode de mapa', link: '/pt/map-shortcode/' },
              { text: 'Bloco de mapa', link: '/pt/map-block/' },
              { text: 'Bloco de mapa de uso único', link: '/pt/one-time-map-block/' },
              { text: 'Incorporação de mapa', link: '/pt/map-embed/' },
              { text: 'Geolocalização de posts', link: '/pt/geolocating-posts/' },
            ],
          },
          {
            text: 'IA',
            items: [
              { text: 'IA no JEO', link: '/pt/ai-in-jeo/' },
              { text: 'Configurações de IA', link: '/pt/ai-settings/' },
              { text: 'Assistente de Contexto com IA', link: '/pt/ai-context-assistant/' },
              { text: 'Georreferenciamento com IA', link: '/pt/ai-georeferencing/' },
              { text: 'Geolocalização em lote com IA', link: '/pt/ai-bulk-geolocation/' },
            ],
          },
          {
            text: 'Desenvolvedor',
            items: [
              { text: 'Informações geográficas', link: '/pt/dev/geo-information/' },
              { text: 'Geocodificadores', link: '/pt/dev/geocoders/' },
              { text: 'Tipos de camada', link: '/pt/dev/layer-types/' },
              { text: 'API de tipos de camada', link: '/pt/dev/layer-types-api/' },
              { text: 'Migração', link: '/pt/dev/migration/' },
              { text: 'Compatibilidade com PHP', link: '/pt/dev/php-compatibility/' },
              { text: 'Manutenção de dependências', link: '/pt/dev/dependency-maintenance/' },
            ],
          },
          { text: 'Baixar', link: 'https://wordpress.org/plugins/jeowp/' },
        ],

        sidebar: [
          { text: 'Início', link: '/pt/' },
          {
            text: 'Plugin',
            items: [
              { text: 'Visão geral', link: '/pt/index-plugin/' },
              { text: 'Conceitos', link: '/pt/concepts/' },
              { text: 'Primeiros passos', link: '/pt/getting-started/' },
              { text: 'Camadas', link: '/pt/layer-post/' },
              { text: 'Mapas', link: '/pt/map-post/' },
              { text: 'Discovery', link: '/pt/discovery/' },
              { text: 'Mapa narrativo', link: '/pt/story-map/' },
              { text: 'Histórias próximas a você', link: '/pt/stories-near-you/' },
              { text: 'Minimapa', link: '/pt/minimap/' },
              { text: 'Shortcode de mapa', link: '/pt/map-shortcode/' },
              { text: 'Bloco de mapa', link: '/pt/map-block/' },
              { text: 'Bloco de mapa de uso único', link: '/pt/one-time-map-block/' },
              { text: 'Incorporação de mapa', link: '/pt/map-embed/' },
              { text: 'Geolocalização de posts', link: '/pt/geolocating-posts/' },
            ],
          },
          {
            text: 'IA',
            items: [
              { text: 'IA no JEO', link: '/pt/ai-in-jeo/' },
              { text: 'Configurações de IA', link: '/pt/ai-settings/' },
              { text: 'Assistente de Contexto com IA', link: '/pt/ai-context-assistant/' },
              { text: 'Georreferenciamento com IA', link: '/pt/ai-georeferencing/' },
              { text: 'Geolocalização em lote com IA', link: '/pt/ai-bulk-geolocation/' },
            ],
          },
          {
            text: 'Desenvolvedor',
            items: [
              { text: 'Informações geográficas', link: '/pt/dev/geo-information/' },
              { text: 'Geocodificadores', link: '/pt/dev/geocoders/' },
              { text: 'Tipos de camada', link: '/pt/dev/layer-types/' },
              { text: 'API de tipos de camada', link: '/pt/dev/layer-types-api/' },
              { text: 'Migração', link: '/pt/dev/migration/' },
              { text: 'Compatibilidade com PHP', link: '/pt/dev/php-compatibility/' },
              { text: 'Manutenção de dependências', link: '/pt/dev/dependency-maintenance/' },
            ],
          },
        ],
      },
    },
  },

  // Site is served under jeowp.org/docs/
  base: '/docs/',
  cleanUrls: true,
  srcExclude: ['README.md'],

  // Build straight into the committed site/ tree (same contract as MkDocs)
  outDir: '../site/docs',
  emptyOutDir: true,

  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/docs/favicon.svg' }]],

  themeConfig: {
    logo: {
      light: { src: '/logo-light.svg', alt: 'JEO Maps' },
      dark: { src: '/logo-dark.svg', alt: 'JEO Maps' },
    },
    // Logo click goes to the landing page, not the docs home.
    logoLink: 'https://jeowp.org/',

    // The logo SVG already carries the "JEO Maps" wordmark — showing the
    // site title next to it would duplicate the brand. The page-level
    // `title` ("JEO Maps") still names browser tabs and search results.
    siteTitle: false,

    socialLinks: [
      { icon: 'github', link: 'https://github.com/InfoAmazonia/jeo-plugin' },
    ],

    search: {
      provider: 'local',
      options: {
        // pt-BR UI strings for the search modal (English stays the default).
        locales: {
          pt: {
            translations: {
              button: {
                buttonText: 'Pesquisar',
                buttonAriaLabel: 'Pesquisar na documentação',
              },
              modal: {
                displayDetails: 'Exibir lista detalhada',
                resetButtonTitle: 'Limpar pesquisa',
                backButtonTitle: 'Fechar pesquisa',
                noResultsText: 'Nenhum resultado para',
                footer: {
                  selectText: 'para selecionar',
                  navigateKeyBuffer: 'para navegar',
                  closeKeyBuffer: 'para fechar',
                },
              },
            },
          },
        },
      },
    },

    outline: {
      level: [2, 3],
    },
  },
})
