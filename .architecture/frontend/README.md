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

## Editor↔Frontend Layer Rendering Parity

The editor (`map-blocks/`) and frontend (`jeo-map/`) use **separate rendering code** but must produce visually consistent results. The key divergence point is `load_as_style` for `mapbox`-type layers.

### `load_as_style` (Mapbox Style as Base)

When a `mapbox` layer instance has `load_as_style: true`, the full Mapbox vector style replaces the map's base:

| Context | Mechanism |
|---------|-----------|
| **Frontend** | `class-jeo-map.js::getStyleLayer()` returns the style URL as the map's initial `mapStyle`. `mapbox.js::addStyle()` calls `map.setStyle()`. `style_layers` filtering applied after load. |
| **Editor** | `use-style-layer.js::findStyleLayer()` detects the style layer, passes the URL as `<Map mapStyle={...}>`. `map-preview-layer.js::renderLayer()` returns `null` for style layers. `applyStyleLayerFiltering()` applies `style_layers` filtering in `onStyleData`. |

### Shared Utility: `use-style-layer.js`

| Export | Purpose |
|--------|---------|
| `getMapboxStyleUrl(layer, instance)` | Builds the Mapbox Styles API URL (mirrors `mapbox.js::getStyleUrl()`) |
| `findStyleLayer(loadedLayers, instances)` | Finds the first instance with `load_as_style`, returns `{ instance, url, transformRequest }` |
| `styleLayerMapProps(styleBase)` | Returns `{ mapStyle, transformRequest? }` ready to spread on `<Map>` |
| `applyStyleLayerFiltering(map, instance)` | Removes/hides sub-layers per `style_layers` config (mirrors `class-jeo-map.js` lines 208-231) |

### Editors with `load_as_style` Support

| Editor | File | Status |
|--------|------|--------|
| Minimap | `minimap-editor.js` | ✅ Supported |
| Map block | `map-editor.js` | ✅ Supported |
| Onetime map | `onetime-map-editor.js` | ✅ Supported |
| Storymap | `storymap-editor.js` | ✅ Supported |

### Token Handling

The Mapbox token (`mapbox_key`) is localized identically in both contexts via the shared `mapgl` script. Per-layer `access_token` overrides are fully supported in both editor and frontend:

| Context | `load_as_style: false` | `load_as_style: true` |
|---------|------------------------|-----------------------|
| **Frontend** | Inline `access_token` in raster URL (`mapbox.js:25`) | Inline in style URL (`mapbox.js:177`) + `checkCustomToken`/`transformRequestUrl` re-signs derived requests (`class-jeo-map.js:1823-1871`) |
| **Editor** | Inline `access_token` in raster URL (`map-preview-layer.js:31`) | Inline in style URL + `createTokenAwareTransformRequest` re-signs derived requests (composed on top of runtime's `mapboxTransformRequest`/native `accessToken`) |

The editor's token-aware transform (`use-style-layer.js::createTokenAwareTransformRequest()`) mirrors the frontend's `transformRequestUrl` logic. It matches the Mapbox username extracted from `style_id` and replaces `access_token` on any matching request, then delegates to the runtime's default transformRequest. Works for both MapLibre and Mapbox runtimes.

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
