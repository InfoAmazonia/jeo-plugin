# Discovery (Map Exploration)

## Key Files

| File | Role |
|------|------|
| `src/js/src/discovery/index.js` | `Discovery` class — main app (incl. `transformRequestUrl`, `registerLayerCustomToken`, `composedStyleDefaultGlyphs`) |
| `src/js/src/discovery/blocks/sidebar.js` | Tabbed sidebar |
| `src/js/src/discovery/blocks/stories.js` | Stories tab (posts) |
| `src/js/src/discovery/blocks/map-layers.js` | Map layers tab (composed Mapbox style layer support) |
| `src/js/src/discovery/blocks/map-item.js` | Individual map card |
| `src/js/src/discovery/blocks/search.js` | Search input |
| `src/js/src/discovery/blocks/date-range-filter.js` | Date range filter |
| `src/js/src/discovery/blocks/tag-filter-control.js` | Tag filter |
| `src/templates/discovery.php` | Discovery page template |
| `src/templates/embed-discovery.php` | Embed template |

## Overview

Discovery is a standalone application (not a Gutenberg block) that renders:
1. Fullscreen map (MapLibre/Mapbox)
2. Sidebar with tabs: **Stories** and **Map Layers**
3. Sharing toolbar

## DOM Mount

- Target element: `#discovery` or `.discovery-embed`
- Template: `discovery.php` (page template) or `embed-discovery.php`

## Tab: Stories

1. Fetches posts via WP REST API with filters (search, date range, tags)
2. Builds clustered GeoJSON from posts with `_related_point`
3. Renders markers + clusters on map
4. Infinite scroll in sidebar
5. Hover highlights feature via `setFeatureState`
6. Click opens popup with details

## Tab: Map Layers

1. Fetches maps via WP REST API
2. Expands each map showing its layers
3. Toggle individual layers (add/remove from map)
4. Drag-to-reorder selected layers (`react-movable`)
5. Applies changes to map: `addSource`/`addLayer`/`removeLayer`/`moveLayer`

### Composed Mapbox Style Layers

`mapbox`-type layers in Discovery compose per-map. Key methods in `blocks/map-layers.js`:

- `fetchComposedMap(mapId)` — cached per-mapId; fetches metadata then style+manifest
- `addComposedMapboxLayer(layer)` — extracts the manifest layer, clones composite layer
  definitions, preloads sprites via a sprite atlas pipeline (`loadSpriteAtlas` with `@2x`
  fallback, `addImageFromAtlas`, `registerStyleImageMissingHandler`), ensures glyphs
  (`ensureMapGlyphs` + `composedStyleDefaultGlyphs`), adds layers before
  `unclustered-points`, and binds interactions (`addComposedInteractions`, ignoring events
  over story features). State tracked in `composedLayerState`.
- `removeComposedMapboxLayer` — cleans interactions, removes layers and unused sources
- `applyLayersChanges` — sequence-guarded (`applyLayersSequence`) for rapid toggles

Token handling uses `transformRequestUrl` (placeholder replacement + per-owner custom
tokens via `registerLayerCustomToken`). See [`composed-styles/README.md`](../composed-styles/README.md).

## Sharing

The toolbar supports:
- WhatsApp
- Twitter/X
- Email
- Embed iframe (copies URL)
- URL-based state (share link preserves position/zoom/layers)

## Webpack Entry Point

| Entry | File | Dependency |
|-------|------|------------|
| `discovery` | `discovery/index.js` | `jeoMap` |
