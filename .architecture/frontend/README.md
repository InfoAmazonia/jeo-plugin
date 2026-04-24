# Frontend: MapLibre / Mapbox / React

## Key Files

| File | Role |
|------|------|
| `src/js/src/lib/mapgl-loader.js` | Runtime selector (MapLibre or Mapbox) |
| `src/js/src/lib/mapgl-react.js` | Re-export React components |
| `src/js/src/lib/maplibregl/maplibregl-loader.js` | MapLibre GL loader |
| `src/js/src/lib/maplibregl/maplibregl-react.js` | MapLibre React wrapper |
| `src/js/src/lib/mapboxgl/mapboxgl-loader.js` | Mapbox GL loader |
| `src/js/src/shared/` | Shared utilities |

## Dual Runtime: MapLibre vs Mapbox

### Automatic Selection

```
mapgl-loader.js
  ├── If map_runtime_requested == 'mapbox' AND mapbox_key exists
  │   └── Uses mapboxgl-loader.js (globalThis.mapboxgl)
  └── Else
      └── Uses maplibregl-loader.js (bundled)
```

### MapLibre GL (Default)

- **Bundled** via npm (`maplibre-gl`)
- Enriched with `map-gl-utils` for convenience
- Default style: OSM raster tiles
- CSS injected programmatically

### Mapbox GL (Optional)

- **NOT bundled** — uses `globalThis.mapboxgl` loaded via `wp_enqueue_script`
- Token injected via `transformRequest`
- Patches for missing/deprecated APIs: `getLight()`, `getSky()`, `setSky()`

## Iframe Compatibility (Block API v3)

Gutenberg Block API v3 renders blocks in iframes. The loaders apply extensive patches:

### HTMLElement/MouseEvent instanceof

```javascript
// Cross-document instanceof fix
HTMLElement[Symbol.hasInstance] = function( obj ) {
    return obj instanceof iframeHTMLElement || originalCheck( obj );
};
```

### FullscreenControl

Patched to use `document.fullscreenElement` from iframe container.

### Drag Listeners

React wrapper duplicates listeners from parent document to iframe document.

### ResizeObserver

Used to detect map container size changes.

## React Components

### Map (`mapgl-react.js`)

Wrapper around `react-map-gl/maplibre` with:
- Automatic `FullscreenControl` and `NavigationControl`
- ResizeObserver for auto-resize
- Event forwarding: `onMove`, `onZoom`, `onSourceData`, `onError`

### Layer & Source

Re-exports from `react-map-gl/maplibre`:
- `Source`: raster, vector, geojson, image, video
- `Layer`: fill, line, symbol, circle, heatmap, raster, hillshade, background

## Shared Utilities

| File | Export | Description |
|------|--------|-------------|
| `shared/rest-records.js` | `useRecordsByIds`, `usePaginatedRecords` | Hooks for WP REST API |
| `shared/schema-form.js` | `SchemaForm` | JSON Schema form (RJSF + WP components) |
| `shared/wp-form-controls.js` | `CheckboxControl`, etc. | WP components with next-gen props |
| `shared/story-geojson.js` | `buildRelatedPostsGeoJson` | GeoJSON builder with FNV-1a hash IDs |
| `shared/async-combobox-control.js` | `AsyncComboboxControl` | Async combobox with loading |
| `shared/direction.js` | `computeInlineStart/End` | LTR/RTL support |
| `shared/intersect.js` | `onFirstIntersection` | Lazy init via IntersectionObserver |
| `shared/wait.js` | `waitMapEvent`, `waitUntil` | Promise-based event waiters |
| `shared/locale.js` | `getDocumentLocale` | Locale utilities |
| `shared/intl.js` | `formatDate`, `formatHour` | Intl API wrappers |
| `shared/styles.js` | `EMPTY_STYLE` | Empty MapLibre style |
| `shared/url-normalization.js` | `normalizeOptionalUrl` | URL helper |

## Webpack Entry Points

| Entry | File | `dependOn` |
|-------|------|------------|
| `mapglLoader` | `lib/mapgl-loader.js` | — |
| `mapglReact` | `lib/mapgl-react.js` | `mapglLoader` |
| `jeoMap` | `jeo-map/index.js` | `mapglLoader` |
| `jeoStorymap` | `jeo-storymap/storymap-display.js` | `jeoMap` |
| `discovery` | `discovery/index.js` | `jeoMap` |
| `mapBlocks` | `map-blocks/index.js` | `mapglReact` |
| `layersSidebar` | `layers-sidebar/index.js` | `mapglReact` |
| `mapsSidebar` | `maps-sidebar/index.js` | `mapglReact` |
| `postsSidebar` | `posts-sidebar/index.js` | — |
| `JeoLayer` | `includes/layer-types/JeoLayer.js` | — |
| `JeoLegend` | `includes/legend-types/JeoLegend.js` | — |

## Development Notes

1. **Never** import `maplibre-gl` or `mapbox-gl` directly — always use `lib/mapgl-loader.js`
2. For React map components, use `lib/mapgl-react.js`
3. WP form controls must come from `shared/wp-form-controls.js` (not `@wordpress/components` directly)
4. `splitChunks: false` — each entry is self-contained
