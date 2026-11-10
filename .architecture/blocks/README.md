# Gutenberg Blocks

## Key Files

| File | Role |
|------|------|
| `src/includes/class-jeo.php` | Registers most blocks via `register_block_type()` |
| `src/js/src/map-blocks/index.js` | Webpack entry point `mapBlocks` |
| `src/js/src/map-blocks/map-editor.js` | Edit component for `jeo/map-blocks` |
| `src/js/src/map-blocks/onetime-map-display.js` | Save component for one-time map |
| `src/js/src/map-blocks/onetime-map-config.js` | Attributes for one-time map |
| `src/js/src/map-blocks/minimap-editor.js` | Edit component for `jeo/ai-minimap` |
| `src/js/src/map-blocks/minimap-display.js` | Save component for `jeo/ai-minimap` |
| `src/js/src/map-blocks/minimap-config.js` | Attributes for `jeo/ai-minimap` |
| `src/js/src/map-blocks/layers-settings.js` | Layer configuration UI inside block |
| `src/js/src/map-blocks/layers-settings-modal.js` | Modal wrapper for layers settings |
| `src/js/src/map-blocks/map-preview-layer.js` | Renders layer in editor preview |
| `src/js/src/map-blocks/preview-error.js` | Single preview error state (cause + action + collapsed detail with "Copy details") shared by the layer editor, map editor and minimap — replaces the courtesy base map on source failure |
| `src/js/src/map-blocks/modals.css` | Opaque modal overlay (`overlayClassName="jeo-opaque-overlay"`) for the layers/interactions/style modals |
| `src/js/src/shared/form-guard.js` | `FormGuard` (deterministic publish lock from data validation + pre-publish/sidebar panel warning) and `EmptyCanvasGuide` ("save the draft to load the editor" notice for empty map/map-layer canvases). Notice ids are namespaced per guard (`jeo_required_fields_{lockKey}`, `jeo_empty_canvas_guide_{postType}`) and effects only run for the guard's own post type — the two sidebar plugins stay registered on every screen and must never erase each other's notices (Gate 2 — G1). The empty-canvas notice waits ~1.5s before showing (anti-flicker) and its "Save draft" action defensively lifts the guard locks around `savePost()` — drafts stay savable (BUG-02) |
| `src/js/src/shared/save-error-notice.js` | Contract A on the save surface: when a save/publish fails with the humanized payload (`error.data.{action,detail}`), replaces the core `editor-save` notice with the single error pattern (cause + action + collapsed detail + "Copy details"). Payload-less errors keep the stock core notice |
| `src/js/src/layers-sidebar/form-validation.js` | Pure form-validation helpers (`validateLayerFormData`, `validateMapFormData`) — single source of truth for the publish lock |
| `src/js/src/map-blocks/mapbox-style-preview.js` | Composed Mapbox style adapter for editor previews (AbortSignal stale-state guard, token transform) — see [`composed-styles/README.md`](../composed-styles/README.md) |
| `src/js/src/map-blocks/jeo-autosuggest.js` | Autosuggest for searching maps/storymaps. Opt-in `showPrivate` prop queries `publish,private,future` (falls back to `publish` when the user lacks permission); used by the storymap editor map search |
| `src/js/src/map-blocks/color-palettes.js` | Color palette (437 colors) |
| `src/includes/minimap/class-minimap.php` | `Jeo\Minimap` — REST endpoint, base layer logic |

## Registered Blocks

Registered in `class-jeo.php` on `init` hook:

| Block | Render | Description |
|-------|--------|-------------|
| `jeo/map-blocks` | Server-side (`render_callback`) | Selectable map from library |
| `jeo/storymap` | Server-side | Scrollytelling storymap with chapters |
| `jeo/embedded-storymap` | Server-side | Embeddable storymap |
| `jeo/map-editor` | Dynamic (iframe) | Inline map preview in editor; also manages zoom controls and pan-limits bridge via `window.parent` |
| `jeo/layer-editor` | Dynamic (iframe) | Inline layer preview in editor; shows the shared preview error state on source failure (never locks saving — the publish lock is data-validation-only, owned by the sidebar `FormGuard`) |
| `jeo/stories-near-you` | Skeleton + JS (self-registered) | Geolocated posts sorted by proximity — see [`stories-near-you/README.md`](../stories-near-you/README.md) |
| `jeo/ai-minimap` | Client-side save (`<div class="jeomap">`) | AI-assisted contextual map with agent-powered generation and multi-turn chat refinement. See [`minimap/README.md`](../minimap/README.md) |

## Gutenberg Sidebar Plugins

| Plugin | Entry Point | Post Type | Description |
|--------|------------|-----------|-------------|
| `jeo-layers-sidebar` | `layers-sidebar/index.js` | `map-layer` | Layer editing forms (settings, attribution, legend) + `FormGuard`/`EmptyCanvasGuide`/`SaveErrorNotice`. Map preview is in the `jeo/layer-editor` block |
| `jeo-maps-sidebar` | `maps-sidebar/index.js` | `map`, `storymap` | Map/storymap editing forms (layers first — above the fold, related posts, settings) + `FormGuard`/`EmptyCanvasGuide`/`SaveErrorNotice` + "saved without layers" autosave notice (CTA deduplicated when the core autosave banner is present). Map preview is in the `jeo/map-editor` block |
| `jeo-posts-sidebar` | `posts-sidebar/index.js` | All | Post geolocation |

## Block Creation Pattern

1. Define attributes in JS (`attributes` in `registerBlockType` or config file)
2. Create `Edit` component (React) using `@wordpress/block-editor`
3. Create `Save` component or use `render_callback` PHP (server-side)
4. Register in `class-jeo.php` via `register_block_type()`, or self-register in a dedicated class
5. Add entry point in `webpack.config.js` if needed

## Block Frontend Dependencies

- `@wordpress/block-editor` — `useBlockProps`, `InnerBlocks`, `InspectorControls`
- `@wordpress/components` — `Modal`, `PanelBody`, `Button`, etc.
- `@wordpress/data` — `withSelect`, `withDispatch`, `useSelect`
- `../lib/mapgl-react` — `Map`, `Layer`, `Source` (React wrappers)
- `../shared/wp-form-controls` — Wrappers with next-gen props

## Server-Side Render

Blocks with `render_callback` in PHP receive `$attributes` and return HTML:
- Map blocks: inject `<div class="jeomap" data-map_id="...">` which `JeoMap` JS initializes
- Storymap blocks: inject `<div class="storymap-container">` with chapter data

## Composed Style Editor Previews

Map, onetime-map, and storymap editors render `mapbox`-type layers via composed styles
(see [`composed-styles/README.md`](../composed-styles/README.md)). When the loaded layers
include a `mapbox` type (`hasMapboxStyleLayers`), the editor loads the composite style
(`useComposedMapPreviewStyle` / `useComposedPayloadPreviewStyle`) and sets it as the
`<Map mapStyle>`. The map `key` includes the composed `metadata.hash` so React remounts
when the artifact changes. The `jeo/layer-editor` block uses `useMapboxStylePreview`
(single raw Mapbox style, not the composer).

## Preview Error Pattern (W1)

All editor preview surfaces (layer editor, map editor, minimap) share one error state
(`map-blocks/preview-error.js`): cause in one sentence + action + collapsed technical
detail with "Copy details". A failed source (401/404/network/invalid style) replaces the
preview area with this state — the default base map is never rendered as a "courtesy map"
that fakes success. Server errors are consumed through the humanized payload
`{ message, action, detail }` when present (see `getServerErrorPayload`); otherwise the
error is classified client-side from the HTTP status. Publish locking never depends on
render success — it derives from `validateLayerFormData`/`validateMapFormData`
(`layers-sidebar/form-validation.js`) and is applied by `FormGuard`
(`shared/form-guard.js`), mounted from the sidebar plugins so it also works when the
preview block is not mounted. Drafts of render-broken layers stay savable.

Source-attributed error fatality (Gate 2 — RISK-01): the "loaded" guards
(`loadedRef`/`mapLoadedRef`) only count the layer's **own** GL source — the base
style loading first must not shield a dead layer source (the old courtesy-map
symptom). Errors attributed to a JEO layer source (`source_{instance.id}`, see
`map-preview-layer.js`) are fatal until that source has produced real content
(`sourcedata` with `sourceDataType === 'content'`); after content, later errors
(e.g. a single failing tile while panning) are incidental and the live map stays.
Style-type layers keep the previous semantics — for them the base style IS the
layer. In the map editor the zoom controls (Initial/Min/Max) are hidden while the
error state replaces the preview.

The same Contract A payload is also honored on the **save surface** (Gate 2 —
BUG-01): `shared/save-error-notice.js` watches `core.getLastEntitySaveError` after
a failed save and, when the error carries `data.action`/`data.detail`, replaces
the core `editor-save` notice with the enriched pattern (headline mirrored from
core's publish/update logic + cause + action + collapsed detail + "Copy details").
The classic settings screens (`settings-page.js`) render the same payload via
`renderContractError()` for the API-key, embedding and retrieval tests.

Behavior note (Gate 2 — OBS-01): because `FormGuard` lives in the always-mounted
sidebar plugins, the **first save of a new layer/map requires a complete form** —
before W1 the lock lived in the preview block, which only mounted after the first
save. This is the intended behavior of spec 1.3 (a layer without a type is
useless); the `EmptyCanvasGuide`'s "Save draft" action works around it for the
empty-canvas recovery path by lifting the guard locks around `savePost()`.

## Block Category

All blocks are registered under the `jeo` category (added via `block_categories_all` filter).
