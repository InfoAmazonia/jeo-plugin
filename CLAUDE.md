# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Authoritative references — read these first

This repo already ships deep, maintained documentation. Prefer it over re-deriving things:

- **`AGENTS.md`** — full command list, stack, conventions, AI architecture details, WordPress.org compliance rules, and quality gates. The single most important file.
- **`.architecture/README.md`** — index of per-domain docs (ai, blocks, geocoding, layers, maps, minimap, minilayer, rest-api, settings, stories-near-you, storymap, etc.) with data flows and patterns. **Read the relevant domain doc before starting a task in it.**
- **`GEMINI.md`** — architectural mandates for AI agents.

**MANDATORY:** When you create/remove/modify components, blocks, CPTs, REST routes, or settings, update both the affected `.architecture/*.md` file **and** the relevant `AGENTS.md` section. This is a hard project rule.

Respond to the user in **Brazilian Portuguese (pt-BR)**; write code, comments, and commit messages in plain English.

## Repository shape (non-obvious)

- **The plugin is deployed from `src/`, not the repo root.** Repo root holds tooling, build scripts, CI, and dev dependencies. PHP runtime lives in `src/includes/`, JS sources in `src/js/src/`, built bundles in `src/js/build/` (gitignored — never commit them).
- **Two Composer manifests, intentionally segregated:**
  - root `composer.json` → **dev only** (PHPCS, WPCS, PHPCompatibility)
  - `src/composer.json` → **production only** (`neuron-core/neuron-ai`, `hacklabr/ai-assistant`)
  - root `post-install-cmd`/`post-update-cmd` auto-install prod deps into `src/vendor/`. Release builds must include `src/vendor/`.
- **Node 24 is required and enforced.** `devEngines` makes npm **error** on other majors (e.g. Node 25). If a build fails with `EBADDEVENGINES`, run `nvm use` (or `nvm use 24`) first. `scripts/install-and-build.sh` has an nvm fallback baked in.

## Common commands

```bash
# Build (run `nvm use` first if on the wrong Node)
npm run build:assets          # webpack prod build + WordPress.org compliance patch
npm run build                 # full release: assets + i18n compile (needs WP-CLI)
npm start                     # webpack watch (dev)

# PHP lint (scope to src/ to avoid .tmp/ noise)
vendor/bin/phpcs src/
vendor/bin/phpcbf src/        # auto-fix
# One-time WPCS setup if phpcs can't find standards:
vendor/bin/phpcs --config-set installed_paths "vendor/wp-coding-standards/wpcs,vendor/phpcsstandards/phpcsutils,vendor/phpcsstandards/phpcsextra"
php scripts/check-php-compat.php   # static PHP 8.0–8.5 compat check

# Tests (Jest via wp-scripts)
npm run test:unit
npm run test:unit -- path/to/file.test.js          # single file
npm run test:unit -- -t "name of the test case"    # single test by name

# Local WordPress (Docker) — src/ is mounted live, no reinstall after edits
bash .docker/start.sh         # WordPress on http://localhost:8081, DB on :3307 (jeo/jeo/jeo)
bash .docker/wp.sh <cmd>      # WP-CLI inside the container
```

## High-level architecture

JEO is a WordPress/Gutenberg plugin for geojournalism — geotagged posts rendered as interactive map layers. Backend is PHP; editor and frontend are React/Gutenberg.

**PHP backend (`src/includes/`):** PSR-0 autoload (`Jeo\ClassName` → `class-class-name.php`), `Jeo\Singleton` trait, global accessors (`jeo_settings()`, `jeo_maps()`, `jeo_layers()`, `jeo_minimap()`, `jeo_context_handler()`, …). Three CPTs: `map`, `map-layer`, `storymap`. Post geolocation is stored in the `_related_point` meta (rich REST schema) plus generated index metas `_geocode_*_p` / `_geocode_*_s` (primary/secondary).

**AI layer (`src/includes/ai/`):** Built on NeuronAI + `hacklabr/ai-assistant`, unified through `JEO_AI_Factory` (creates Assistants), `Tool_Registry` (reusable tools: `search_layers`, `geocode`, `generate_layer`, `get_post_content`, `retrieve_knowledge`), and `AI_REST_Permissions`. Each feature is an agent with a structured-output DTO and conversation storage (`WP_Storage`):
- **Georeferencing** — extracts coordinates from post text with confidence/relevance.
- **RAG** — two vector stores (`jeo_knowledge` for posts, `jeo_layers_knowledge` for layers), indexed in background; topK clamped 1–50.
- **AI Minimap** (`jeo/ai-minimap` block) — contextual maps via RAG or conversational agent (`Minimap_Output`).
- **Minilayer** — generates Mapbox layers via MCP.
- **Context Assistant** — editorial paragraph/reference suggestions sidebar (see the extensive Context Assistant section in `AGENTS.md` before touching it — it has dual chat/AI storage and inline-link/anti-hallucination prompt rules).
- **Bulk geolocation** — batch-geolocates old posts via WP-Cron.

**Maps & layers (`src/js/src/`):** Dual runtime — **MapLibre GL (default, bundled) / Mapbox GL (optional, only if `mapbox_key` set)** — always loaded via `lib/mapgl-loader.js`, never imported directly. Layer types register themselves on the global `window.JeoLayerTypes` from standalone IIFE files in `src/includes/layer-types/*.js` (these are not webpack modules; share helpers via the `JeoLayerTypes` instance). Live previews live inside editor blocks (`jeo/map-editor`, `jeo/layer-editor`) — not sidebars — and every editor `edit` component is wrapped in `<AsyncModeProvider value={true}>` to tame `wp.data` re-renders. Extensive patches exist for the Gutenberg Block API v3 iframe editor (cross-document `instanceof`, listener rebinding, fullscreen, ResizeObserver).

**Other blocks:** `jeo/stories-near-you` (geolocated "near me" posts with consent-gated browser geolocation; native `core/latest-posts` or Newspack rendering; proximity SQL via `ST_Distance_Sphere`), plus Storymap (scrollytelling) and the Discovery exploration app.

## Conventions that bite if missed

- **Text domain is `jeowp`** in every `__()/_e()/_x()` and in `src/jeo.php` — never the old `jeo`. The WordPress.org distribution slug is also `jeowp` (language files `jeowp.pot`, `jeowp-pt_BR.po`).
- Use `shared/wp-form-controls.js`, not `@wordpress/components` directly, for form controls.
- Webpack uses `splitChunks: false` — each entry is self-contained.
- PHP version floor (currently 8.2) must stay in sync across `src/jeo.php` header, the runtime `version_compare` check, and `src/readme.txt`.
- Dynamic CSS from settings must sanitize each value individually (`sanitize_hex_color()`, `floatval()`+`esc_attr()`); AJAX endpoints that expose/mutate data must check `current_user_can('edit_posts')` beyond nonces.
