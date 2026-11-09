# JEO Documentation

> See "Translations (pt-BR)" at the bottom for the bilingual workflow.

JEO acts as a geojournalism platform which allows news organizations, bloggers and NGOs to publish news stories as layers of information on digital maps. With JEO, creating the interaction between data layers and contextual information is much more intuitive and interactive.

You can post geotagged stories and create richly designed pages for each one of the featured stories. At the same time, by configuring layers hosted on Mapbox and choosing between MapboxGL and MapLibreGL, you can manage sophisticated maps without losing performance, add legends directly with HTML and set the map parameters. All directly at the WordPress dashboard.

JEO wants to help journalists and NGOs to improve storytelling with maps. Creating a child theme with all its functionality is easy since it contains all the necessary hooks to customize layouts and data visualization.

[Get Started](getting-started.md)

## Features

- MapboxGL and MapLibreGL map rendering
- Custom tile layers
- [Mapbox](https://www.mapbox.com/) maps
- Layer filtering options, allowing you to mix tile layers.
- Geocoding WordPress posts using OpenStreetMap (Nominatim), with extensibility for additional geocoders via hook.
- Customizable marker icons that can be associated to categories, custom taxonomies or posts directly.
- Map markers query integrated to posts query.
- Support [WPML](https://wpml.org/pt-br/) and [Polylang](https://wordpress.org/plugins/polylang/) multilingual plugins
- AI-powered georeferencing with multiple AI providers
- AI-assisted map generation (Minimap) with chat refinement
- Stories Near You block with geolocation-based post discovery

## User tutorials

- **Layers**

  - [Creating a layer](layer-post.md)

- **Maps**

  - [Creating maps](map-post.md)
  - [Editing map layers](map-post.md#map-layers)

- **Posts**

  - [Geolocating posts](geolocating-posts.md)
  - [AI Georeferencing](ai-georeferencing.md)
  - [AI Bulk Geolocation](ai-bulk-geolocation.md)

- **AI Features**

  - [AI in JEO](ai-in-jeo.md)
  - [AI Settings](ai-settings.md)
  - [Minimap — AI-Assisted Map Block](minimap.md)

- **Stories Near You**

  - [Stories Near You block](stories-near-you.md)

## Developer documentation

### Tutorials

- [Adding new Layer Types](dev/layer-types.md)
- [Geographical Information of a post](dev/geo-information.md)
- [Writing a Geocoder](dev/geocoders.md)

### Features

- [Map Shortcode](map-shortcode.md)

### Differences between the old and the present JEO

- [Migration](dev/migration.md)

## Translations (pt-BR)

The site is bilingual: English at the root and pt-BR under `docs/pt/` (VitePress `locales` in `docs/.vitepress/config.mts`; the navbar language switcher appears automatically from the locale labels).

Workflow when changing a page:

1. Edit the English page.
2. Update `docs/pt/<same-path>.md` with the translation — or run `npm run docs:pt:sync`, which creates/refreshes an English copy flagged with the "not yet translated" banner (`<TranslationPendingPT />`, frontmatter `untranslated: true`) until someone translates it. The script never overwrites translated pages.

Rules for pt pages:

- Images are referenced one `../` level up (`../img/`, `../../img/` from `dev/`).
- Relative `.md` links stay unchanged — they resolve to the pt sibling pages.
- Intra-page anchors are re-slugged to the translated headings (github-slugger style: lowercase, hyphens, accents kept).
- Code blocks, hooks, REST routes, file paths, and identifiers are never translated.
- UI terminology follows `src/languages/jeowp-pt_BR.po` plus the docs glossary (Minimapa, Mapa Narrativo, "Discovery" kept as-is, "mapa de uso único").
