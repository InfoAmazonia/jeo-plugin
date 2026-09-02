# JEO Plugin

WordPress plugin for interactive maps in the block editor (Gutenberg).

## Writing Style

Write all code, comments, commit messages, and documentation in plain English. Be clear and concise.

**Communication Language**: Always respond to the user in Brazilian Portuguese (pt-BR), unless explicitly requested otherwise.

## Documentation Maintenance (MANDATORY)

When making significant code changes (creating/removing/modifying components, blocks, CPTs, REST routes, settings, etc.), update **both**:

1. **`.architecture/`** — Update the `.md` file(s) for the affected domain. See `.architecture/README.md` for task-to-file mapping. Examples: new block → `blocks/README.md`; new geocoder → `geocoding/README.md`; new REST endpoint → `rest-api/README.md`.
2. **`AGENTS.md`** — If the change affects stack, commands, directory structure, or conventions, update the relevant sections below.

## Stack

- PHP 8.2+ | WordPress 6.6+ (tested up to 7.0) + Gutenberg | React 18
- MapLibre GL JS (default) / Mapbox GL JS (optional)
- NeuronAI (10 providers) | Webpack 5, @wordpress/scripts | Node 24+

Node 24 is enforced by `devEngines` in `package.json` (`onFail: "error"`). If a command fails with `EBADDEVENGINES`, run `nvm use 24` first.

### Version Consistency

Keep PHP version enforcement in sync across three locations:
1. `src/jeo.php` plugin header: `Requires PHP:`
2. `src/readme.txt`: `Requires PHP:`
3. Runtime check in `src/jeo.php`: `version_compare( PHP_VERSION, '8.2', '<' )`

All three must match the supported PHP floor (currently 8.2).

## Commands

```bash
# JS / Build
npm start                          # Dev (webpack watch)
npm run build:assets               # Webpack production build + compliance patch
npm run build                      # Full release build: assets + i18n compile (requires WP-CLI)
npm run build:release              # Alias for npm run build
npm run build:report               # Bundle size budgets (size-limit)
npm run test:unit                  # Jest
npm run test:unit -- path/to/file.test.js          # single file
npm run test:unit -- -t "name of the test case"    # single test by name
npm run sync:version               # Sync version across src/jeo.php, package.json, package-lock.json, and translation catalogs

# i18n (requires WP-CLI)
npm run i18n:pot                   # Regenerate src/languages/jeowp.pot
npm run i18n:po                    # Update PO files from POT
npm run i18n:mo                    # Compile MO files
npm run i18n:json                  # Generate Jed JSON translations
npm run i18n:compile               # MO + JSON
npm run i18n:refresh               # assets + POT + PO (use before committing string changes)

# WP-CLI (AI / Minilayer)
wp jeo ai generate-layer "rivers in Brazil" [--layer_name="Rivers"]
wp jeo ai generate-boundary "São Paulo" [--type=municipality] [--context="São Paulo, Brazil"]
wp jeo ai test-minilayer "roads in Rio"

# PHP
vendor/bin/phpcs --standard=phpcs.xml.dist    # PHP lint (WPCS) — matches CI
vendor/bin/phpcbf src/                        # Auto-fix WPCS issues
vendor/bin/phpcs --standard=phpcs-compat.xml.dist   # PHP 8.2–8.5 compatibility check

# Audits
npm run audit:npm                  # npm audit --package-lock-only
npm run audit:composer             # composer audit --locked

# Release helpers
bash scripts/install-and-build.sh  # Clean install + build + zip (with nvm fallback)
bash scripts/build.sh              # Canonical release builder

# Local WordPress (Docker)
bash .docker/start.sh              # Start WordPress + MariaDB containers
# WordPress: http://localhost:8081
# DB:        localhost:3307 (jeo/jeo/jeo)
# Plugin src/ is mounted live — no need to reinstall after edits.
# Stop:   docker compose -f .docker/docker-compose.yml down
# WP-CLI: docker compose -f .docker/docker-compose.yml --profile cli run --rm jeo-dev-wpcli <command>
#         or bash .docker/wp.sh <command>
bash .docker/switch-php.sh         # Switch Docker PHP version for local testing
```

## Conventions

- **PHP**: Custom PSR-0-like autoload (`Jeo\ClassName` → `class-class-name.php`; underscores become hyphens), WPCS, `Jeo\Singleton` trait, PHPDoc required on all classes and methods
- **Accessors**: `jeo()`, `jeo_maps()`, `jeo_layers()`, `jeo_settings()`, `jeo_context_handler()`, `jeo_minimap()`, `jeo_minilayer_handler()`, `jeo_geocode_handler()`, `jeo_layer_types()`, `jeo_legend_types()`, `jeo_sidebars()`, `jeo_menu()`, `jeo_storymap()`, `jeo_stories_near_you()`, etc.
- **Text domain**: All internationalized strings must use the WordPress.org slug **`jeowp`** (e.g. `__( '...', 'jeowp' )`). Never use the old `jeo` text domain.
- **Plugin slug**: WordPress.org distribution slug is **`jeowp`**. Release packages, CI workflows, smoke tests, and language file names (`jeowp.pot`, `jeowp-pt_BR.po`) must use this slug.
- **Map runtime**: Always via `lib/mapgl-loader.js`, never import maplibre/mapbox directly
- **Per-layer access tokens**: All Mapbox-dependent layer types (`mapbox`, `mvt`, `mapbox-tileset-raster`, `mapbox-tileset-vector`) support an optional `access_token` in `layer_type_options` that overrides the global `mapbox_key`. The composer resolves tokens per-layer: mapbox layers with neither a per-layer `access_token` nor a global `mapbox_key` are skipped during composition (not blocking). Tilesets use owner-based `transformRequest` matching; MVT appends the token to the tile URL via `_resolveUrl` / `add_query_arg`.
- **WP form controls**: Use `shared/wp-form-controls.js` (not `@wordpress/components` directly)
- **Webpack**: `splitChunks: false` — each entry is self-contained
- **Meta REST**: `_related_point` for geolocation, with full REST schema (14+ fields including `_ai_quote`). Generated index metas `_geocode_lat_*_p` / `_geocode_lon_*_p` (primary) and `_geocode_lat_*_s` / `_geocode_lon_*_s` (secondary) support spatial queries.
- **Iframe compat**: Extensive patches for Gutenberg Block API v3 (iframe editor) — `instanceof` duck-typing, event listener rebinding, fullscreen control patches, missing-CSS detection, ResizeObserver
- **Editor↔Frontend parity**: The editor preview and frontend use separate rendering code but must match. For `load_as_style` (mapbox layers loaded as the map's base style), use `map-blocks/use-style-layer.js` (`findStyleLayer`, `applyStyleLayerFiltering`) — mirrors `class-jeo-map.js` frontend logic. `map-preview-layer.js::renderLayer` returns `null` for style layers. All map editors (minimap, map, onetime-map, storymap) are integrated.
- **Async mode**: All editor blocks (`jeo/map`, `jeo/onetime-map`, `jeo/layer-editor`, `jeo/map-editor`, etc.) wrap their `edit` component in `<AsyncModeProvider value={ true }>` to batch re-renders from `wp.data` store changes. Sidebars and `PluginDocumentSettingPanel` integrations (e.g. `context-sidebar`) do not need this wrapper.
- **Layer editor architecture**: The `map-layer` CPT editor uses two systems: (1) `jeo-layers-sidebar` for settings forms (no map preview), and (2) `jeo/layer-editor` block (`layer-editor-preview.js`) for the live preview, notices, and post save locking. The sidebar's redundant `<Map>` and dead `LayerPreviewPortal` were removed to eliminate dual-map re-render loops. The block preview uses `loadedRef` to guard `onSourceData`, updates in-place (no `key`-based remount), and `SchemaForm` dispatches are debounced (500ms).
- **Minimap layer UX**: Selected layers in `jeo/ai-minimap` expose an opacity slider (`layers[i].opacity`, 0–1) applied to both editor preview and frontend renderers. The layer library and selected-layer panels display the layer `excerpt` (CPT supports `excerpt`), attribution, and themes for disambiguation.
- **Minimap layer provenance**: Each layer object carries an optional `provenance` field (`'manual'` | `'ai'`). Layers added via the layer library modal are `'manual'`; AI-generated layers are `'ai'`. During chat refinement, `preserve_manual_layers()` guarantees that manual layers dropped by the AI are merged back — unless the AI declares them in `Minimap_Output::$removed_layer_ids` (a structured-output field the AI populates when the user explicitly asks to remove a layer; language-agnostic, no keyword lists). On regenerate, manual layers are NOT preserved (fresh start). `tag_layer_provenance()` propagates the field across responses. `build_state_context()` annotates manual layers with `[manually added]` in the AI prompt.
- **Minimap render order**: `Minimap::normalize_layer_render_order()` stable-sorts layers bottom-to-top as raster → vector (base layer is separate and always below). Raster group: `tilelayer`, `mapbox-tileset-raster`, plus `mapbox` styles whose style JSON contains raster sub-layers (fetched via shared `Jeo::fetch_mapbox_style()`, transient-cached; fetch failure = raster, conservatively). Vector group: `mvt`, `mapbox-tileset-vector`, vector-only `mapbox` styles. All render paths stack by array order, so this covers editor, frontend, and composed styles. Applied in `run_agent()` (all AI paths) and legacy `api_setup()` (RAG).
- **Minimap version history**: `_jeo_minimap_versions_{conversation_id}` post meta (capped at `Minimap::VERSIONS_LIMIT = 20`, oldest dropped) stores a snapshot per successful AI turn (post-normalization layers/base/center/zoom/pins + label + timestamp). "Return to previous version" works deterministically: the AI declares `Minimap_Output::$restore_version` (1-based, only on explicit user request — see the version list in `build_state_context()`), and `apply_version_restore()` replaces the output with the stored snapshot. Restore turns SKIP `tag_layer_provenance`, `apply_diff_guard`, and `preserve_manual_layers` (restores are exact snapshots — manual layers added later are dropped). Restores append a new version entry (git-revert semantics). Legacy conversations have no history: invalid/absent versions fall back to the AI reconstruction with a notice — never crashes. `to_rest_response()` includes `restored_version` (additive).
- **Mapbox style fetch helper**: `Jeo::fetch_mapbox_style( $style_id, $token, $args )` (class-jeo.php) is the single Mapbox Styles API client, used by the composer and the minimap. Successful fetches are transient-cached (`jeo_mapbox_style_json_*`, TTL filter `jeo_mapbox_style_cache_ttl`, default 1h; `bypass_cache` arg to skip). The cache is purged by the composer on `save_post_map-layer` and on forced refresh (`refresh` REST param / layer cache-refresh endpoint) via `Jeo::delete_mapbox_style_cache()`. Never fetch Mapbox styles inline — reuse this helper.
- **Boundary layer generation**: `Place_Polygon_Service` (`class-place-polygon-service.php`) resolves a place name into an authoritative polygon using adapter-specific public sources: IBGE for Brazilian municipalities/states, FUNAI WFS for indigenous lands, and Nominatim + Overpass for international boundaries. Results are cached per place, deduplicated by content hash, and published as WordPress attachment GeoJSON files for stable public URLs.
- **Mapbox style builder**: `Mapbox_Style_Builder` (`class-mapbox-style-builder.php`) constructs and publishes Mapbox GL styles deterministically to the Mapbox Styles API, replacing the Mapbox DevKit MCP. It extracts the Mapbox username from the access token's JWT-like payload and validates published styles via `Jeo::fetch_mapbox_style()`.
- **Boundary tool**: `Generate_Boundary_Layer_Tool` is registered in `Tool_Registry` and exposed to the minimap agent when a Mapbox key is configured. It may be called proactively for administrative boundaries and indigenous lands; non-boundary layers still require explicit user authorization via `Generate_Layer_Tool`.
- **Map layer opacity**: Raster layer types set `raster-opacity`; vector layer types multiply existing paint opacity properties by the instance opacity. Default is `1`.
- **Map editor architecture**: Same pattern as layer editor. The `jeo-maps-sidebar` provides settings panels only (layers, related posts, embed URL, map settings). The live map preview, zoom controls, and pan-limits live in the `jeo/map-editor` block (`map-editor-preview.js`). The sidebar's redundant `<Map>` and dead `MapPreviewPortal` were removed. The block preview uses local `viewState` for dragging (no `editPost` per pixel), persists on `onMoveEnd`/`onZoomEnd` only, and updates in-place (no `key`-based remount). Pan-limits are bridged to the sidebar via `window.parent.__jeoSetPanLimitsFromMap`.
- **Build output**: `src/js/build/` is gitignored; bundles are generated by webpack and must not be committed
- **CPTs**: `map`, `map-layer`, `storymap` — each with custom capabilities and full REST meta schemas. Additional internal CPT: `jeo-ai-log` (AI usage/cost logging).
- **Vendor assets**: Third-party libraries (e.g. Select2) are bundled locally under `src/includes/vendor/`. Avoid CDN URLs in production code.
- **CSS escaping**: Dynamic CSS generated from settings must sanitize each value individually. Use `sanitize_hex_color()` for colors, `floatval()` + `esc_attr()` for sizes, and a dedicated regex helper for font-family names. Do not rely on `wp_kses(..., null)` for CSS contexts.
- **i18n escaping**: Translated strings that are output must be escaped. Prefer `esc_html__()` / `esc_html_e()` / `esc_attr__()` / `esc_attr_e()` over raw `__()` / `_e()` when rendering HTML/attributes, per WordPress.org security best practices.
- **Privacy**: The plugin implements `wp_add_privacy_policy_content()`, personal data exporters/erasers for `_related_point`, and a complete `uninstall.php` cleanup.
- **Uninstall flow**: The plugin overrides the default WordPress "Delete" link with a dedicated confirmation page (`admin.php?page=jeo-uninstall-confirm`) that lists all data to be removed and requires explicit user consent before deletion.
- **AI System Prompt**: The default prompt is calibration-aware (`System_Prompt_Builder::for_georeferencing()`). It dynamically reads active calibration settings (granularity, confidence, title weight, thresholds, primary/secondary max points) and injects them as editorial rules. When adding new calibration controls, propagate them to:
  1. The default prompt builder (`class-system-prompt-builder.php`)
  2. The prompt generator meta-prompt (`class-ai-handler.php::api_chat_prompt_generator()`)
  3. Frontend post-processing (`posts-sidebar/index.js::applyPointLimits()`)
  4. Bulk post-processing (`class-bulk-processor.php::approve_post()`)
  5. The structured output schema description if it affects filtering behavior (`class-georeference-result.php`)
- **AI Architecture**: All new AI features should use `JEO_AI_Factory` to create `Assistant` instances. Tools must be registered in `Tool_Registry`. REST endpoints should use `AI_REST_Permissions`; a few legacy endpoints (minimap, context) still use inline `current_user_can(...)` closures and should be migrated when touched. MCP servers are passed declaratively via `AssistantConfig::$mcps`.
- **Minilayer**: Thematic layer generation uses `Minilayer_Classifier` (single structured-output call) + `Minilayer_Service` + `Mapbox_Style_Builder`. The Mapbox DevKit MCP path and `JEO_AI_Factory::create_minilayer_assistant()` have been removed. `Generate_Boundary_Layer_Tool` handles boundaries deterministically; `Generate_Layer_Tool` handles thematic layers. Generated `map-layer` CPTs are enriched by `Minilayer_Metadata` with `post_excerpt`, `layer-theme` taxonomy, attribution, and an auto-generated `simple-color` legend when a representative color exists.
- **Minimap**: AI-assisted map block (`jeo/ai-minimap`). Follows the same Assistant architecture as Minilayer/Context Assistant with structured output (`Minimap_Output`), conversation storage (`WP_Storage`), and optional Minilayer integration. See `.architecture/minimap/README.md` before modifying endpoints, tools, or editor state.
- **Composer dependencies**: Dependencies are segregated:
  - Root `composer.json` / `composer.lock` → **dev only** (PHPCS, WPCS, PHPCompatibility)
  - `src/composer.json` / `src/composer.lock` → **production only** (`neuron-core/neuron-ai`, `hacklabr/ai-assistant`)
  - Root `post-install-cmd` / `post-update-cmd` automatically install production deps into `src/vendor/`
  - Release builds must include `src/vendor/` from the production Composer install
- **AI logging & helpers**: Internal CPT `jeo-ai-log` (`class-ai-logger.php`) records AI usage/costs. Supporting classes include `RAG_Backup`, `RAG_Worker`, `AI_Test`, and `Color_Describer`.
- **AI Context Assistant**: Editorial suggestion sidebar for posts. Uses the same Assistant architecture as the minimap but with distinct agent, tools, and output DTO. Key patterns and regression guards:
  - **Agent factory**: `Context_Agent::create()` in `class-context-agent.php`. Uses `AssistantConfig` with `outputClass: Context_Generation_Output`, `conversationStorage: WP_Storage(post)`, `learningStorage: WP_Option_Storage`, `userMemoryStorage: WP_User_Memory_Storage`, `autoLearn: true`, `autoDelegate: true`. Do not remove these storages or the conversation history will break.
  - **System prompt**: Defaults to `default_system_prompt()`. Overridden by `ai_context_prompt` setting (JEO AI Settings → Context Assistant tab). The setting is stored as structured-output JSON (`{"prompt":"..."}`) but rendered as plain text; always use `Context_Agent::extract_prompt_text()` when reading it for runtime use. When editing the prompt, preserve the `## User Preferences` and `## Additional Context` injection points or user memory and live state will be lost.
  - **Critical prompt rules**: `Context_Agent::critical_prompt_rules()` contains non-negotiable instructions for inline contextual links, factual grounding, and recency tie-breaking (when retrieved articles have similar relevance scores, the more recently published one is preferred — tie-breaker only, enabled by the `date` field exposed by `retrieve_knowledge`). The default prompt concatenates these rules automatically. Custom prompts should preserve them; use the **Prompt Engineering Assistant** to enforce them.
  - **Inline contextual links**: Paragraph `text` may contain `<a href="URL">anchor text</a>`. The anchor MUST be the specific phrase, name, fact, or number the reference supports — never the full article title. Example: `"The death of <a href=\"URL\">leader Gabriel Ferreira</a> highlights..."`. Post-generation validation only checks that link URLs exist in the `references` array (prevents fabricated citations). Anchor grounding is enforced by the system prompt and the human editor, not by an automated check.
  - **Factual grounding**: Every factual claim must come from `get_post_content` or `retrieve_knowledge`. The agent must NOT invent names, terms, dates, statistics, or events. If references are insufficient, it should say so in `assistant_message` instead of writing a generic paragraph. The agent must NOT reference or link to the post being edited — the current article is never a valid source for its own paragraphs (no self-links, no self-references in text, no self-citations in `references`). This is enforced both in the system prompt (`critical_prompt_rules()`) and as a post-generation safety net in `validate_generated_output()`.
  - **Prompt Engineering Assistant**: `Context_Agent::engineer_custom_prompt()` and REST endpoint `POST /jeo/v1/context/engineer-prompt` (permission: `manage_options`) turn a natural-language description into an optimized system prompt while injecting the critical rules and preserving injection points. The JEO AI Settings UI exposes a separate description textarea (saved to `localStorage`) and a "Generate Custom Prompt" button that calls this endpoint. A companion "Suggest initial prompt" button copies the built-in default prompt into the custom prompt field as a starting point.
  - **Tools**: `retrieve_knowledge` (RAG retrieval from `jeo_knowledge`) and `get_post_content` (for the `post_analyzer` sub-agent). Both are registered in `Tool_Registry`. Removing either will break the agent.
  - **REST handler**: `Context_Handler` (`class-context-handler.php`), Singleton, registers `/jeo/v1/context/setup`, `/jeo/v1/context/chat`, `/jeo/v1/context/state`, `/jeo/v1/context/clear`, and `/jeo/v1/context/engineer-prompt`. Uses the same `inject_history` / `persist_history` pattern as `Minimap` **for AI context only**.
  - **Setup behavior**: The initial `/context/setup` call does **not** generate paragraph suggestions. It asks 1-2 clarifying questions to understand the user's intent; paragraph generation happens in subsequent `/context/chat` messages.
  - **Retry logic**: `run_agent()` retries up to 3 times with exponential backoff (`min(attempt * 2, 8)` seconds) on empty responses, network errors, 5xx, and 429 responses. Non-retryable errors (4xx except 429) are classified via `HttpException->response->statusCode` (numeric comparison, not regex). After exhausting retries, it throws a user-friendly exception.
  - **Error persistence**: On retry exhaustion in `api_chat()`, the user message is persisted to **both** stores (UI messages saved before `run_agent()`; ConversationStore appended after retries exhausted). This ensures the message survives page reload and the AI retains context for subsequent turns. `api_setup()` does not persist on error. The Minimap follows the same pattern: frontend preserves the user message in block attributes on `.catch()`; backend appends to ConversationStore in `catch` blocks of `api_chat()` and `api_setup_prompt()`.
  - **Content validation**: `api_setup()` checks the post content length. If fewer than 100 characters (after stripping tags), it returns immediately without calling the AI, asking the user to write more or specify what they want.
  - **Chat message storage (dual storage)**: The UI chat history is stored separately from the AI context history to avoid JSON schema pollution from structured output:
    - `_jeo_ai_context_chat_messages` (object array) — clean messages for UI display only. Populated explicitly in `api_setup()` and `api_chat()` with the original user message and the `assistant_message` from the DTO. Each user message stores `user_id` so the UI can display the author's username.
    - `_jeo_ai_context_conversation_id` + `ConversationStore` (via `WP_Storage`) — raw history for AI context continuity. This storage may contain schema-injected messages; do not use it directly for UI rendering.
    - `api_get_state()` reads from `_jeo_ai_context_chat_messages` for `messages`, and from `_jeo_ai_context_last_response` for `paragraphs`/`references`. It does **not** read from `ConversationStore`.
    - `api_clear()` deletes four meta keys (`_jeo_ai_context_conversation_id`, `_jeo_ai_context_last_response`, `_jeo_ai_context_chat_messages`, `_jeo_ai_context_suggestion_history`) and removes the raw AI conversation thread via `ConversationStore::deleteThread()`, resetting the conversation and suggestion history completely.
  - **Suggestion history**: The panel keeps a versioned history of generated suggestion sets (`_jeo_ai_context_suggestion_history`), allowing users to browse and restore previous outputs. The history UI lives in `context-chat-panel.js` and is visible in both the compact sidebar panel (scrollable list) and the expanded modal.
  - **Paragraph format**: The `text` field in `Context_Generation_Output::$paragraphs` supports basic inline HTML: `<strong>`, `<em>`, `<a href="...">`, `<br>`. The system prompt and schema description instruct the AI to use these tags. The frontend sanitizes HTML before rendering (whitelist: `strong`, `b`, `em`, `i`, `br`, `a`).
  - **Frontend**: Entry point `contextSidebar` (webpack). Uses `registerPlugin('jeo-context-sidebar')` with `PluginDocumentSettingPanel`. The panel is **not** auto-triggered; the user must click "Generate Suggestions" to call `/context/setup`. Subsequent messages go to `/context/chat`.
  - **Editor integration (Insert)**: Creates a `core/paragraph` block with `content: sanitizedHtml`. The `content` attribute accepts inline HTML (`<strong>`, `<em>`, `<a>`), which Gutenberg preserves.
  - **Editor integration (Copy)**: Triple-fallback rich-text copy to the clipboard:
    1. `navigator.clipboard.write()` with `ClipboardItem` (`text/html` + `text/plain`)
    2. DOM selection + `document.execCommand('copy')` (most reliable in Gutenberg iframe)
    3. `navigator.clipboard.writeText()` (plain text only)
  - **UI controls**: Below the textarea there are three buttons:
    - **Send** — submits the user's message to `/context/chat`.
    - **Retry** — sends an implicit "Generate new suggestions" message to `/context/chat` without requiring user input.
    - **Clear** — calls `/context/clear` and resets all local state (messages, paragraphs, conversation ID).
  - **User badge**: User messages display a discreet username badge in the top-right corner (from `msg.username` returned by `api_get_state()`), useful for collaborative editing.
  - **State persistence**: Conversation ID, last suggestions, and clean chat messages are persisted in post meta. On mount, the frontend calls `GET /jeo/v1/context/state` to restore the previous session. This allows closing/reopening the panel or refreshing the page without losing context.
  - **Post type gate**: Only loads for post types in `enabled_post_types` (same filter as geolocation and minimap). The asset `jeo-context-sidebar` is enqueued in `class-jeo.php::enqueue_blocks_assets()` alongside `jeo-js`.
  - **Settings**: `ai_context_prompt` is a textarea in the AI Settings "Context Assistant" tab. Default is empty (uses built-in prompt). Sanitized with `sanitize_textarea_field()` in `Settings::sanitize_settings()`. The UI stores the value internally as structured-output JSON (`{"prompt":"..."}`) and decodes it back to plain text on load; any backend consumer must extract the prompt text with `Context_Agent::extract_prompt_text()`.
- **Structured Output** (`ai_use_structured_output`): Defaults to `true`. When enabled, georeferencing uses NeuronAI's native `Agent::structured()` method with the `Georeference_Result` DTO; the API provider enforces the JSON schema natively (e.g. OpenAI `response_format`, Gemini `responseSchema`). When disabled, the system falls back to free-text prompt + `parse_json_from_text()` regex extraction. The fallback is automatic — if structured output throws, the adapter silently retries via the text path. Token usage tracking is unavailable in structured mode (reported as 0). Override prompts containing `[SKIP_ENFORCED_SCHEMA]` force free-text mode even when the setting is on (used by internal tools). The Prompt Assistant (prompt generator) adapts its meta-prompt instructions based on this setting: when structured is active it omits JSON formatting mandates from generated prompts; when inactive it appends the aggressive `CRITICAL INSTRUCTION` block. The adapter also strips legacy JSON instructions via `strip_legacy_json_instructions()` as a safety net when structured output is active.

## Architecture

See `.architecture/README.md` — index of domain docs with diagrams, data flows, and code patterns. Read the relevant file before starting a task.

## Testing & Compliance

### Quality Gates

The repository maintains the following automated checks. All must pass before a release:

- `vendor/bin/phpcs --standard=phpcs.xml.dist` — WPCS lint (requires `vendor/bin/phpcs --config-set installed_paths "vendor/wp-coding-standards/wpcs,vendor/phpcsstandards/phpcsutils,vendor/phpcsstandards/phpcsextra"`)
- `vendor/bin/phpcs --standard=phpcs-compat.xml.dist` — Static PHP 8.2-8.5 compatibility review
- `bash scripts/wordpress-smoke.sh` — WordPress bootstrap smoke test (requires WP-CLI + local MariaDB)
- `node scripts/patch-build-compliance.mjs` + WordPress Plugin Check workflow — WordPress.org directory compliance
- `node scripts/validate-release-meta.mjs` — Release metadata consistency
- `npm run test:unit` — Jest unit tests
- `npm run build:report` — Bundle size budgets

### CI/CD

GitHub Actions run via **9 workflows** in `.github/workflows/` plus a shared composite action in `.github/actions/wordpress-plugin-check/`. Notable flows:
- `deploy-wordpress-org.yml` — GitHub Release + WordPress.org deploy (can be split via workflow input)
- `plugin-check.yml` — WordPress Plugin Check, now reuses `.github/actions/wordpress-plugin-check`. Advisory by default: results (errors/warnings with file + line) surface as annotations, a `$GITHUB_STEP_SUMMARY` table, and an uploaded artifact, but the job stays green. Set the composite action input `fail-on-errors: true` on any caller to opt back into failing on errors.
- `wordpress-smoke.yml` — Builds webpack assets once, uploads artifact, and downloads it across the WordPress/PHP matrix
- `wordpress-languages.yml` — Validates POT/PO catalogs match source strings
- `php-compat.yml` — PHP 8.2-8.5 compatibility check
- `phpcs-wpcs.yml` — WPCS lint
- `node-frontend.yml` — Node build + Jest tests
- `dependency-review.yml` — Dependency security review
- `docs-site.yml` — Documentation site deploy

### WordPress.org Compliance Rules

- `src/jeo.php` **must** contain `Requires PHP:` in the plugin header, aligned with `src/readme.txt` and the runtime check (currently 8.2+). Since WordPress 5.8, `Requires PHP` and `Requires at least` are primarily read from the plugin header, but keeping them in `readme.txt` preserves compatibility.
- `src/readme.txt` **must** contain `Tags:` (1–5 recommended by WordPress.org; up to 12 is the hard limit) and `Requires PHP:` aligned with runtime enforcement (8.2+). Validate the readme with the [official readme validator](https://wordpress.org/plugins/developers/readme-validator/) before release.
- The plugin **Text Domain** must be `jeowp` in `src/jeo.php` and in every `__()` / `_e()` / `_x()` call. The text domain must match the plugin slug for WordPress.org language-pack delivery.
- `src/readme.txt` **must** contain a `== Third Party Services ==` section.
- Forbidden URLs in any `src/` text file: `raw.githubusercontent.com`, `fonts.openmaptiles.org`.
- Use `cdn.jsdelivr.net/gh` as an alternative for GitHub raw assets.
- The `patch-build-compliance.mjs` script runs automatically after `npm run build:assets` to strip `ajv-validator` `raw.githubusercontent.com` URLs from emitted bundles. It does **not** patch other forbidden URLs (e.g. `fonts.openmaptiles.org` or third-party `raw.githubusercontent.com` references). Keep forbidden URLs out of source code; the script only handles the ajv-specific case.
- AJAX endpoints that mutate or expose data must check `current_user_can('edit_posts')` in addition to nonces.
- Frontend geolocation features must obtain explicit user consent before calling `navigator.geolocation.getCurrentPosition()`.
- Release ZIP must stay under **10 MB** and must not include development artifacts (`node_modules`, test folders, source maps, uncompiled sources). The canonical builder (`scripts/build.sh`) already strips these.

### Settings Validation

- `map_runtime` is sanitized in `Settings::sanitize_settings()`. Selecting `mapboxgl` without a valid `mapbox_key` is rejected and silently falls back to `maplibregl`.
- `ai_rag_topk` is clamped to 1–50 in `Settings::sanitize_settings()` and defaults to 10. It controls the `FileVectorStore` retrieval ceiling.
- `geolocation_precision` is clamped to 1–5 in `Settings::sanitize_settings()` and defaults to 2. It controls decimal places kept from browser geolocation in Stories Near You (user location only, not post geocoding). Passed to frontend via `wp_localize_script` as `jeo_snu_config.geolocationPrecision`. Also controls `DECIMAL(10,N)` cast precision (precision + 1, range 2–6) for post coordinates in `get_nearby_posts()` SQL, avoiding false-precision distance computations against low-resolution user locations.

## Notes

- Plugin is deployed from `src/` (not repo root)
- PHPCS configured in `phpcs.xml.dist` | CI via GitHub Actions (9 workflows)
- `.tmp/` is generated by `scripts/wordpress-smoke.sh` and is gitignored
