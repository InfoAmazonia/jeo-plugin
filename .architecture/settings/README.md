# Settings & Admin

## Key Files

| File | Role |
|------|------|
| `src/includes/settings/class-settings.php` | `Jeo\Settings` class — 60+ options |
| `src/includes/settings/settings-page.php` | Settings page template |
| `src/includes/settings/settings-page.js` | Interactive JS (Select2, API tests) |
| `src/includes/vendor/select2/` | Locally bundled Select2 assets (no CDN) |
| `src/includes/settings/ai-logs-page.php` | AI cost dashboard |
| `src/includes/menu/class-menu.php` | Admin menu |
| `src/includes/admin/dashboard-page.php` | Geographic dashboard |
| `src/includes/admin/welcome-page.php` | Welcome/onboarding |

## Settings (Option `jeo-settings`)

All config in a single array option `jeo-settings`.

### Tabs

| Tab | Section | Key Fields |
|-----|---------|------------|
| General | Map runtime, post types | `map_runtime_requested`, `post_types`, `default_zoom`, `default_center`, `mapbox_key`, `mapbox_secret_key` |
| Geocoders | Geocoding service | `geocoding_service` |
| Appearance | Typography, colors | `font_family`, `font_url`, `primary_color`, `secondary_color` |
| Discovery | Discovery page | `discovery_page_id` |

### AI Settings (Separate tab under Jeo → AI)

| Tab | Keys |
|-----|------|
| Provider | `ai_provider`, `ai_{provider}_key`, `ai_{provider}_model` |
| Knowledge Base | `rag_auto_index`, `rag_post_types` |
| Context Assistant | `ai_use_context_custom_prompt`, `ai_context_prompt` |
| Bulk | `bulk_ai_enabled`, `bulk_ai_post_types`, `bulk_confidence_threshold` |
| Embedded Data | Reference to JSONs in `ai/data/` |

### Sanitization

- API keys: partial masking on display
- Checkboxes: explicit handling per tab (unchecked = absent)
- Colors: hex validation
- Sensitive keys: preserved when input is empty

### Array-Typed Options Read Coercion

`Settings::ARRAY_OPTION_KEYS` (`enabled_post_types`, `jeo_bulk_post_types`) lists
settings that must always be arrays. `Settings::get_option()` runs every stored
value for these keys through `normalize_array_option()`, which converts legacy
comma-separated strings (e.g. `'post,storymap'` written by older plugin versions
or imported databases) into arrays and falls back to the default for empty
strings. This self-heals reads without a DB migration — `foreach`/`in_array`
consumers (meta registration, asset enqueue, bulk processor columns, context
handler, privacy exporters, Stories Near You, RAG worker) always receive an
array.

## Admin Menu

```
Jeo
├── Welcome           (submenu: welcome)
├── Dashboard         (submenu: dashboard)
├── AI                (submenu: ai-settings)
│   └── AI Debug Logs (submenu: ai-logs)
├── Maps              (CPT: map)
├── Layers            (CPT: map-layer)
└── Storymaps         (CPT: storymap)
```

## Geographic Dashboard

Fullscreen page with:
- MapLibre/Mapbox map with all pins clustered
- Filter panel: search, post type, taxonomy, term, timeline range slider
- Fetches `/jeo/v1/all-pins` and `/jeo/v1/dashboard-stats`
- 721 lines of inline template

## Custom CSS

Settings allow defining primary/secondary colors and typography, injected via:
- `wp_head` → inline `<style>` with CSS custom properties
- `wp_enqueue_scripts` / `admin_enqueue_scripts` → Google Fonts

## Global Access

```php
$settings = jeo_settings(); // Returns singleton instance of Jeo\Settings
$value    = jeo_settings()->get_option( 'mapbox_key' );
```

## AI Feature Gating

`AI_Handler::is_configured()` (`src/includes/class-ai-handler.php`) is the single source of truth for "is the AI integration usable?" — a valid `ai_default_provider` slug **plus** its API key (or `ollama_url` for Ollama). It is filterable via `jeo_ai_is_configured`. Never gate AI features on `empty( ai_default_provider )` alone: the option defaults to `'gemini'`, so that check never fires.

Consumers:

| Gate | Location | Behavior when not configured |
|------|----------|------------------------------|
| JS flag `ai_configured` | `class-jeo.php` localizes (`jeo` and `jeoMapVars`) | Editor UI hides AI-only controls (posts-sidebar AI geolocate button, minimap generation form + AI Assistant panel) |
| Context sidebar enqueue | `class-jeo.php::enqueue_blocks_assets()` | `jeo-context-sidebar` script not enqueued — no "AI Context" panel |
| Minimap REST endpoints | `class-minimap.php` (`api_setup`, `api_setup_prompt`, `api_chat`) | `400` with actionable message |
| Knowledge tab CTA | `ai/settings/tab-knowledge.php` | "AI Provider Required" call-to-action |

## Map Defaults Localize

The `jeo_settings.map_defaults` object (localized on the `mapgl` script) uses **`lng`** (MapLibre convention, unified — never `lon`). Read it in JS via `jeo_settings.map_defaults.lng`.

## Mapbox Tokens

Two separate settings, both in the General tab (the Mapbox section is always
visible, regardless of the selected map runtime):

- `mapbox_key` (public `pk.…`): rendering (MapboxGL runtime, Mapbox layers) and
  AI layer pipelines. **Exposed to frontend scripts** via `wp_localize_script`
  — keep its scopes read-only.
- `mapbox_secret_key` (secret `sk.…`): server-only, **never** localized or sent
  to REST responses. Publishing AI-generated styles requires the
  `styles:write` scope, which must not be granted to the public token.

Consumers that publish styles resolve the token via
`jeo_settings()->get_mapbox_publish_token()` (secret wins, fallback to public).
The secret participates in the masked-sensitive-keys loop (submissions
containing `********` keep the stored value) and is trimmed/sanitized on save.
