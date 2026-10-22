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
| `src/js/src/map-blocks/mapbox-style-preview.js` | Composed Mapbox style adapter for editor previews (AbortSignal stale-state guard, token transform) — see [`composed-styles/README.md`](../composed-styles/README.md) |
| `src/js/src/map-blocks/jeo-autosuggest.js` | Autosuggest for searching maps/layers |
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
| `jeo/layer-editor` | Dynamic (iframe) | Inline layer preview in editor; also manages notices and post save locking based on layer load status |
| `jeo/stories-near-you` | Skeleton + JS (self-registered) | Geolocated posts sorted by proximity — see [`stories-near-you/README.md`](../stories-near-you/README.md) |
| `jeo/ai-minimap` | Client-side save (`<div class="jeomap">`) | AI-assisted contextual map with agent-powered generation and multi-turn chat refinement. See [`minimap/README.md`](../minimap/README.md) |

## Gutenberg Sidebar Plugins

| Plugin | Entry Point | Post Type | Description |
|--------|------------|-----------|-------------|
| `jeo-layers-sidebar` | `layers-sidebar/index.js` | `map-layer` | Layer editing forms (settings, attribution, legend). Map preview is in the `jeo/layer-editor` block |
| `jeo-maps-sidebar` | `maps-sidebar/index.js` | `map`, `storymap` | Map/storymap editing forms (layers, related posts, settings). Map preview is in the `jeo/map-editor` block |
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

## Block Category

All blocks are registered under the `jeo` category (added via `block_categories_all` filter).
