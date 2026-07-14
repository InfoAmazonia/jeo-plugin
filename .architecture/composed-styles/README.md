# Composed Mapbox Styles (Map Style Composer)

The **Map Style Composer** merges one or more remote Mapbox GL styles (plus direct
tile layers) into a single cached **Mapbox Style JSON** artifact that MapLibre GL JS
(the plugin's default runtime) can render natively — without requiring the official
Mapbox GL JS runtime. This replaces the legacy "Mapbox Static Tiles overlay"
rendering path for `mapbox`-type layers (shipped in 3.1.0).

## Key Files

| File | Role |
|------|------|
| `src/includes/maps/class-map-style-composer.php` | `Jeo\Map_Style_Composer` — backend engine (Singleton) |
| `src/includes/loaders.php` | Accessor `jeo_map_style_composer()` |
| `src/includes/class-jeo.php` | Instantiation (`::init`) + `jeoMapVars` localization |
| `src/js/src/shared/composed-style-data.js` | Frontend/editor data loader (`loadComposedStyleData`) |
| `src/js/src/shared/composed-style-layers.js` | Frontend/editor manifest helpers (visibility, interactions) |
| `src/js/src/map-blocks/mapbox-style-preview.js` | Editor adapter (hooks, token transform, single-style loader) |
| `src/js/src/jeo-map/class-jeo-map.js` | Frontend `JeoMap` composed-style integration |
| `src/js/src/jeo-storymap/storymap-display.js` | Storymap composed-style integration |
| `src/js/src/discovery/blocks/map-layers.js` | Discovery per-map composition + sprite atlas |

## Accessor

```php
jeo_map_style_composer() // → Jeo\Map_Style_Composer::get_instance()
```

Registered in `Jeo::init()` (`class-jeo.php:49`).

## Backend Architecture

### Class & Lifecycle

`Jeo\Map_Style_Composer` (namespace `Jeo`, `Singleton` trait). `init()` registers:

| Hook | Callback | Purpose |
|------|----------|---------|
| `rest_api_init` | `register_rest_routes()` | 7 REST routes (see [REST API](#rest-endpoints)) |
| `save_post_map` | `invalidate_map_cache()` | Clears map composition meta on save |
| `save_post_map-layer` | `invalidate_layer_cache()` | Finds all maps using a layer, invalidates each |

### Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `CACHE_DIR` | `jeo-mapbox-composed-styles` | Subdirectory under `wp_upload_dir()['basedir']` |
| `CACHE_VERSION` | `12` | Bump to invalidate all artifacts; embedded in hash & metadata |
| `TOKEN_PLACEHOLDER` | `__JEO_MAPBOX_ACCESS_TOKEN__` | Replaces raw `access_token=...` in stored style JSON |
| `DEFAULT_FALLBACK_SPRITE` | `mapbox://sprites/mapbox/standard` | Used when source sprites lack icons |
| `VIRTUAL_SCOPE_PREVIEW` | `preview` | Editor preview scope (requires `edit_posts`) |
| `VIRTUAL_SCOPE_ONETIME` | `onetime` | Public one-time map scope (open) |

### Composition Flow

```
build_context(map_id) / build_virtual_context(payload)
  → build_refs_from_settings()     // resolve map-layer posts → refs (type, token, styleId, loadAsStyle, ...)
  → compose_context()
       ├── fetch_mapbox_style()    // GET api.mapbox.com/styles/v1/{styleId} per mapbox ref
       ├── build_composite_sprite()// GD: merge sprites (1x + @2x), prefix image names, pack 2048px canvas
       ├── select_glyphs()         // first bundle with text-font, else first glyphs URL
       ├── merge root properties   // projection, light, terrain, fog (warns on conflicts)
       ├── copy + remap layers     // source remap, ref-layer remap, visibility by `default`, image-prefix rewrite
       ├── normalize_unsupported_expressions()  // replace Mapbox-only pitch/distance-from-center → 0 (MapLibre compat)
       ├── is_style_layer_enabled()// honor per-layer style_layers[].show
       ├── transform_interactions()// remap click/mouseover targets → composite layer IDs
       └── build_direct_layer()    // append mapbox-tileset-*, mvt, tilelayer as plain sources+layers
  → write_json_file() × 3          // style.json, manifest.json, report.json (pretty-printed)
```

### Artifacts (per composition)

Three JSON files written to disk:

| File | Contents |
|------|----------|
| **`style.json`** | Mapbox Style v8 document — renderable by MapLibre. Tokens scrubbed to `TOKEN_PLACEHOLDER`. |
| **`manifest.json`** | Mapping doc: `kind`, `id`, `slug`, `title`, `originalUrl`, and per-layer `layers[]` with `layerPostId`, `loadAsStyle`, `use`, `default`, `initialVisible`, `directLayer`, `prefix`, `imagePrefix`, `interactions[]` (remapped), `compositeLayers[]` (`originalId`, `compositeId`, `type`, `visibleWhenLayerOn`). |
| **`report.json`** | Diagnostics: counts, `spriteSummary`, `warnings[]`. |

The **manifest** maps JEO layer post IDs → composite style-layer IDs. The **style** is the
renderable Mapbox Style JSON. Frontend uses the manifest to drive per-JEO-layer visibility,
interactions, and popups over the composite style layers.

## REST Endpoints

All under namespace `jeo/v1`. See also [`rest-api/README.md`](../rest-api/README.md).

| Route | Method | Permission | Description |
|-------|--------|------------|-------------|
| `/map-style/{id}` | GET | `can_read_map` (published OR `edit_post`) | Metadata (`enabled`, `style`/`manifest` URLs, `warnings`). Arg `refresh` forces regeneration. |
| `/map-style/{id}/style` | GET | `can_read_map` | Serves `style.json` (`Cache-Control: public, max-age=300`) |
| `/map-style/{id}/manifest` | GET | `can_read_map` | Serves `manifest.json` (`Cache-Control: public, max-age=300`) |
| `/map-style/compose` | POST | `can_create_virtual` | Compose from a JSON payload (scope/kind/postId/layers/center/zoom). `onetime`=public, `preview`=logged-in + `edit_posts` |
| `/map-style/layer/{id}/refresh` | POST | `can_refresh_layer` (`map-layer` + `edit_post`) | Force-regenerate all maps referencing a layer. Returns `{mapIds[], refreshed, failed}` |
| `/map-style/{scope:preview\|onetime}/{hash}/style` | GET | `can_read_virtual` | Virtual artifact `style.json` (`onetime`=open, `preview`=logged-in + `edit_posts`) |
| `/map-style/{scope:preview\|onetime}/{hash}/manifest` | GET | `can_read_virtual` | Virtual artifact `manifest.json` |

> **Preview nonce (3.1.1):** for `preview` scope with a logged-in user, the metadata
> response appends `_wpnonce=wp_create_nonce('wp_rest')` to style/manifest URLs so
> Mapbox GL can fetch them directly with cookie/nonce auth.

## Caching

### File Layout (under uploads)

- **Saved maps:** `{uploads}/jeo-mapbox-composed-styles/{map_id}/{hash}/` → `style.json`, `manifest.json`, `report.json`, `sprite*.json/.png`
- **Virtual:** `{uploads}/jeo-mapbox-composed-styles/{scope}/{hash}/`

### Hash / Cache Key

`calculate_hash()` / `calculate_virtual_hash()`: sha1 (truncated to 16 hex chars) of
`{version, mapId/scope+kind+id, modifiedGmt, center, zoom, mapSettings,
refs[layerId, modifiedGmt, type, styleId, layerTypeOptionsHash]}`. Including
`modifiedGmt` + `CACHE_VERSION` means any layer/map edit or version bump produces a
new hash (additive — old artifacts linger until cleanup).

### Reuse Logic

`get_or_create_artifacts()` / `get_or_create_virtual_artifacts()`: if both `style.json`
and `manifest.json` exist and `force_refresh` is false → reuse. Otherwise: `wp_mkdir_p`,
run `compose_context`, write all three JSON files, persist post meta.

### Post Meta (saved maps)

| Meta Key | Purpose |
|----------|---------|
| `_jeo_mapbox_composed_style_hash` | Current hash |
| `_jeo_mapbox_composed_style_warnings` | Warnings array |
| `_jeo_mapbox_composed_style_error` | Last error (cleared on success) |

### Invalidation

- `save_post_map` → deletes the three meta keys above (next read regenerates).
- `save_post_map-layer` → finds all maps using the layer (`get_map_ids_for_layer`,
  serialized-meta LIKE query) and invalidates each.

### Virtual Cache Cleanup

`maybe_cleanup_virtual_cache()` runs opportunistically, gated by a transient
`jeo_mapbox_composed_{scope}_cleanup_lock` (1 hour). Deletes up to 50 directories older
than the TTL (`jeo_mapbox_composed_virtual_cache_ttl`).

## Filters

| Filter | Default | Purpose |
|--------|---------|---------|
| `jeo_mapbox_composed_styles_enabled` | `true` | Master kill-switch |
| `jeo_mapbox_composed_payload_max_bytes` | `65536` (arg: `$scope`) | Max POST payload size |
| `jeo_mapbox_composed_payload_max_layers` | `40` (onetime) / `100` (preview) (arg: `$scope`) | Max layers per payload |
| `jeo_mapbox_composed_style_fallback_sprite` | `mapbox://sprites/mapbox/standard` | Fallback sprite root (`''` disables) |
| `jeo_mapbox_composed_virtual_cache_ttl` | `30 * DAY_IN_SECONDS` (onetime) / `DAY_IN_SECONDS` (preview) (arg: `$scope`) | Virtual cache TTL |
| `jeo_mapbox_composed_style_default_glyphs` | `mapbox://fonts/mapbox/{fontstack}/{range}.pbf` | Default glyphs passed to frontend (in `class-jeo.php`) |

## Frontend Localization (`jeoMapVars`)

Injected by `class-jeo.php` (both frontend `enqueue_blocks_assets` and editor contexts):

| Key | Value |
|-----|-------|
| `composedStyleUrlBase` | `rest_url('jeo/v1/map-style/')` |
| `composedStyleComposeUrl` | `rest_url('jeo/v1/map-style/compose')` |
| `composedStyleDefaultGlyphs` | Filterable default glyph endpoint |
| `nonce` | WP REST nonce (for same-origin `X-WP-Nonce` injection) |

## Frontend Shared Utilities

### `shared/composed-style-data.js`

| Export | Purpose |
|--------|---------|
| `fetchJson(url, options)` | `fetch` wrapper; injects `X-WP-Nonce` for same-origin requests |
| `postJson(url, data, options)` | POST variant with `Content-Type: application/json` |
| `loadComposedStyleData({forceRefresh, includeStyle, mapId, payload, signal, ...})` | Core loader. Payload path → POST `/compose`; mapId path → GET metadata. Fetches manifest (+ style if requested) in parallel. Honors `AbortSignal` for stale-state cancellation. Returns `{manifest, metadata, style}`. |

### `shared/composed-style-layers.js`

| Export | Purpose |
|--------|---------|
| `hasComposedStyle(metadata, manifest)` | `metadata?.style && manifest?.layers?.length` |
| `findComposedManifestLayer(manifest, layerId)` | Match manifest layer by `slug` or `layerPostId` |
| `getComposedLayerVisibility(map, manifest, layerId)` | `'visible'` / `'none'` from first composite layer with `visibleWhenLayerOn !== false` |
| `setComposedLayerVisibility(map, manifest, layerId, visibility)` | Apply visibility to all composite layers of a manifest layer |
| `buildComposedInteractionPopupHtml(feature, interactions)` | Popup `<h3>` (title property) + `<p>` rows from `interaction.fields` (deduped) |
| `addComposedInteractions(map, manifestOrLayers, {shouldIgnoreEvent, visibleLayerIds})` | Bind click/mouseover popups; returns cleanup functions. Mouseover popups use class `jeo-popup__mouseover`. |

## Editor Integration (`mapbox-style-preview.js`)

Editor-side adapter. Exports consumed by all editor blocks:

| Export | Used by | Purpose |
|--------|---------|---------|
| `useComposedMapPreviewStyle({enabled, forceRefresh, mapId, refreshKey})` | `map-editor.js`, `storymap-editor.js` | Saved-map preview via metadata endpoint |
| `useComposedPayloadPreviewStyle({enabled, payload, refreshKey})` | `map-editor-preview.js` (CPT), `onetime-map-editor.js` | Payload preview via POST `/compose` |
| `useMapboxStylePreview(styleUrl)` | `layer-editor-preview.js` | Single raw Mapbox style (does NOT use the composer) |
| `useEditorMapboxTransformRequest(layers)` | all composed editors | Memoized `transformRequest`: replaces `TOKEN_PLACEHOLDER` → encoded token, injects per-owner custom tokens, delegates to base `mapgl-loader.transformRequest` |
| `hasMapboxStyleLayers(layers)` | all editors | Detects if any loaded layer is `type === 'mapbox'` |
| `applyComposedVisibilityFromSettings(map, manifest, layerSettings)` | map editors | Visibility from editor layer settings (swappable/switchable rules) |
| `applyComposedVisibilityFromSelection(map, manifest, selectedLayers)` | storymap | Visibility from selected-layer list per slide |
| `isAbortError(error)`, `handleEditorMapPreviewError(event)` | — | Abort-error handling helpers |

### AbortSignal Stale-State Guard

The internal `useComposedPreviewStyle` hook creates an `AbortController` per effect run,
passes `signal` into `loadComposedStyleData`, and aborts on cleanup. The `.then`/`.catch`
handlers check `signal.aborted` before committing state. This cancels stale in-flight
requests when layers/settings change rapidly.

### Editor Pattern

All editor blocks follow: load layers → `hasMapboxStyleLayers` check → if true, call the
appropriate composed hook → render `<Map mapStyle={composedPreview?.style}>` → wire
`onStyleData={applyComposedVisibility}` → fall back to per-layer `renderLayer` when not
using composed preview. The map `key` includes `composedPreview.metadata?.hash` so React
remounts when the composed artifact changes.

## Rendering Changes (Frontend `JeoMap`)

Previously `mapbox`-type layers rendered as **Mapbox Static Tiles raster overlays** added
individually via `JeoLayer.addLayer()`. Now, when a composed style is available, the entire
set of mapbox layers renders as a **single composite Mapbox GL style** passed as the map's
base `style`, with layer visibility/interactions driven by the manifest. Non-mapbox layers
(tilelayer, mvt, mapbox-tileset-*) still render via the legacy individual-add path.

### `JeoMap` State

| Field | Purpose |
|-------|---------|
| `composedStyleMetadata` | Metadata response (style/manifest URLs) |
| `composedManifest` | Resolved manifest |
| `usingComposedStyle` | Whether composition succeeded |
| `composedStyleError` | Error message (drives warning UI) |
| `composedInteractionCleanups` | Popup cleanup functions |

### Three Fetch Paths

| Method | Trigger | Scope |
|--------|---------|-------|
| `fetchPreviewComposedStyleData()` | `data-preview-map` (editor previewing a saved map; gated to `edit_post`) | `preview` |
| `fetchOnetimeComposedStyleData()` | One-time maps (no `map_id`, has `layers`) | `onetime` |
| `fetchComposedStyleData(mapId)` | Called only by `storymap-display.js` (saved-map endpoint) | saved-map |

### Fallback Behavior

If composition fails or is unavailable, `addComposedStyleWarningMessage()` injects a
`.jeomap-composed-style-warning` div and mapbox-style layers are skipped (they cannot
render without composition).

## Token Handling

All token values are scrubbed to `TOKEN_PLACEHOLDER` before persistence
(`sanitize_tokens_in_value`). The frontend replaces the placeholder at request time:

| Context | Mechanism |
|---------|-----------|
| **Frontend** (`class-jeo-map.js`) | `transformRequestUrl` replaces placeholder → `encodeURIComponent(mapbox_key)`, then applies per-owner `customTokens` (`checkCustomToken` per layer) |
| **Editor** (`mapbox-style-preview.js`) | `useEditorMapboxTransformRequest` mirrors the same logic on top of `mapgl-loader.transformRequest` |
| **Discovery** (`discovery/index.js`) | `transformRequestUrl` + `registerLayerCustomToken` (owner from `style_id`/`tileset_id`) |

Per-layer `layer_type_options.access_token` overrides the global Mapbox key; the composer
assigns it per-bundle and the frontend injects it per-owner via `transformRequest`.

For **MVT** layers with a per-layer `access_token`, the composer appends the token directly
to the tile URL (via `add_query_arg`) and bypasses `sanitize_tokens_in_value`, so the real
token reaches the client rather than being replaced by `TOKEN_PLACEHOLDER`. When no per-layer
token is set, the existing sanitize-to-placeholder behavior is preserved.

## Notes

- **GD extension**: Sprite merging (`build_composite_sprite`) requires PHP GD
  (`imagecreatefromstring`). Without it, sprite generation fails gracefully (warning, no
  sprite set) but composition still succeeds.
- **MapLibre compatibility**: `normalize_unsupported_expressions` replaces Mapbox-only
  expression operators (`pitch`, `distance-from-center`) with `0` so composed styles render
  under MapLibre.
- **`jeo:composed` / `jeo:source` metadata**: Composite layers are tagged with `jeo:composed`
  and source-association metadata for traceability.
