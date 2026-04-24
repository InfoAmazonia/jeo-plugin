# Discovery (Map Exploration)

## Key Files

| File | Role |
|------|------|
| `src/js/src/discovery/index.js` | `Discovery` class — main app |
| `src/js/src/discovery/blocks/sidebar.js` | Tabbed sidebar |
| `src/js/src/discovery/blocks/stories.js` | Stories tab (posts) |
| `src/js/src/discovery/blocks/map-layers.js` | Map layers tab |
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
