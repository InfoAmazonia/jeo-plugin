# JEO Plugin

WordPress plugin for interactive maps in the block editor (Gutenberg).

## Writing Style

Write all code, comments, commit messages, and documentation in plain English. Be clear and concise.

## Documentation Maintenance (MANDATORY)

When making significant code changes (creating/removing/modifying components, blocks, CPTs, REST routes, settings, etc.), update **both**:

1. **`.architecture/`** — Update the `.md` file(s) for the affected domain. See `.architecture/README.md` for task-to-file mapping. Examples: new block → `blocks/README.md`; new geocoder → `geocoding/README.md`; new REST endpoint → `rest-api/README.md`.
2. **`AGENTS.md`** — If the change affects stack, commands, directory structure, or conventions, update the relevant sections below.

## Stack

- PHP 8.2+ | WordPress 6.x + Gutenberg | React 18
- MapLibre GL JS (default) / Mapbox GL JS (optional)
- NeuronAI (10 providers) | Webpack 5, @wordpress/scripts | Node 24+

## Commands

```bash
npm start                          # Dev (webpack watch)
npm run build                      # Production build + i18n JSON
npm run test:unit                  # Jest
vendor/bin/phpcs                   # PHP lint (WPCS)
```

## Conventions

- **PHP**: PSR-0 autoload (`Jeo\ClassName` → `class-class-name.php`), WPCS, `Jeo\Singleton` trait
- **Accessors**: `jeo()`, `jeo_maps()`, `jeo_layers()`, `jeo_settings()`, etc.
- **Map runtime**: Always via `lib/mapgl-loader.js`, never import maplibre/mapbox directly
- **WP form controls**: Use `shared/wp-form-controls.js` (not `@wordpress/components` directly)
- **Webpack**: `splitChunks: false` — each entry is self-contained
- **Meta REST**: `_related_point` for geolocation, with full REST schema
- **Iframe compat**: Patches for Gutenberg Block API v3 (iframe editor)

## Architecture

See `.architecture/README.md` — index of domain docs with diagrams, data flows, and code patterns. Read the relevant file before starting a task.

## Notes

- Plugin is deployed from `src/` (not repo root)
- PHPCS configured in `phpcs.xml.dist` | CI via GitHub Actions (6 workflows)
