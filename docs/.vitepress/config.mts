import { defineConfig } from 'vitepress'

// Route map: source file → URL. Every content page is served as a directory
// route (`/page/`) to keep URL parity with the previous MkDocs build
// (`site_dir: site/docs`, directory URLs). Content pages keep relative
// `img/...` references (resolved against the source file), but internal
// links must use absolute routes (`/page/`, `/dev/page/`) because relative
// `.md` links are resolved against the rewritten path and fail dead-link
// checks.
const pages = [
  'ai-bulk-geolocation',
  'ai-context-assistant',
  'ai-georeferencing',
  'ai-in-jeo',
  'ai-settings',
  'concepts',
  'discovery',
  'getting-started',
  'geolocating-posts',
  'index-plugin',
  'layer-post',
  'map-block',
  'map-embed',
  'map-post',
  'map-shortcode',
  'minimap',
  'one-time-map-block',
  'stories-near-you',
  'story-map',
]

const devPages = [
  'dependency-maintenance',
  'geocoders',
  'geo-information',
  'layer-types',
  'layer-types-api',
  'migration',
  'php-compatibility',
]

const rewrites: Record<string, string> = {}
for (const page of pages) {
  rewrites[`${page}.md`] = `${page}/index.md`
}
for (const page of devPages) {
  rewrites[`dev/${page}.md`] = `dev/${page}/index.md`
}

export default defineConfig({
  lang: 'en',
  title: 'JEO Maps',
  description:
    'Open geojournalism platform for WordPress: publish news stories as layers of information on interactive maps.',

  // Site is served under jeowp.org/docs/
  base: '/docs/',
  cleanUrls: true,
  srcExclude: ['README.md'],
  rewrites,

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

    socialLinks: [
      { icon: 'github', link: 'https://github.com/InfoAmazonia/jeo-plugin' },
    ],

    search: {
      provider: 'local',
    },

    outline: {
      level: [2, 3],
    },
  },
})
