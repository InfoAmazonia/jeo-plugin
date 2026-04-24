# Gutenberg Blocks

## Key Files

| File | Role |
|------|------|
| `src/includes/class-jeo.php` | Registers all blocks via `register_block_type()` |
| `src/js/src/map-blocks/index.js` | Webpack entry point `mapBlocks` |
| `src/js/src/map-blocks/map-editor.js` | Edit component for `jeo/map-blocks` |
| `src/js/src/map-blocks/onetime-map-display.js` | Save component for one-time map |
| `src/js/src/map-blocks/onetime-map-config.js` | Attributes for one-time map |
| `src/js/src/map-blocks/layers-settings.js` | Layer configuration UI inside block |
| `src/js/src/map-blocks/layers-settings-modal.js` | Modal wrapper for layers settings |
| `src/js/src/map-blocks/map-preview-layer.js` | Renders layer in editor preview |
| `src/js/src/map-blocks/jeo-autosuggest.js` | Autosuggest for searching maps/layers |
| `src/js/src/map-blocks/color-palettes.js` | Color palette (437 colors) |

## Registered Blocks

Registered in `class-jeo.php` on `init` hook:

| Block | Render | Description |
|-------|--------|-------------|
| `jeo/map-blocks` | Server-side (`render_callback`) | Selectable map from library |
| `jeo/storymap` | Server-side | Scrollytelling storymap with chapters |
| `jeo/embedded-storymap` | Server-side | Embeddable storymap |
| `jeo/map-editor` | Dynamic (iframe) | Inline map preview in editor |
| `jeo/layer-editor` | Dynamic (iframe) | Inline layer preview in editor |

## Gutenberg Sidebar Plugins

| Plugin | Entry Point | Post Type | Description |
|--------|------------|-----------|-------------|
| `jeo-layers-sidebar` | `layers-sidebar/index.js` | `map-layer` | Layer editing with preview |
| `jeo-maps-sidebar` | `maps-sidebar/index.js` | `map`, `storymap` | Map/storymap editing |
| `jeo-posts-sidebar` | `posts-sidebar/index.js` | All | Post geolocation |

## Block Creation Pattern

1. Define attributes in JS (`attributes` in `registerBlockType` or config file)
2. Create `Edit` component (React) using `@wordpress/block-editor`
3. Create `Save` component or use `render_callback` PHP (server-side)
4. Register in `class-jeo.php` via `register_block_type()`
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

## Block Category

All blocks are registered under the `jeo` category (added via `block_categories_all` filter).
