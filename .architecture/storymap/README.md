# Storymap (Scrollytelling)

## Key Files

| File | Role |
|------|------|
| `src/includes/storymap/class-storymap.php` | CPT `storymap`, template, archives |
| `src/js/src/jeo-storymap/storymap-display.js` | Frontend rendering (scrollama) |
| `src/js/src/maps-sidebar/storymap-sidebar.js` | Gutenberg sidebar (embed URL) |
| `src/templates/single-storymap.php` | Single template |
| `src/templates/embed-storymap.php` | Embed template |

## Custom Post Type: `storymap`

- Template lock: uses `jeo/storymap` as mandatory block
- Archives: optionally included in general archives (`pre_get_posts`)
- REST: enriched with co-author data

## Block `jeo/storymap`

### InnerBlocks (Chapters)

Each chapter (`jeo/storymap-chapter`) contains:
- Text content (RichText)
- Navigation config: `center_lat`, `center_lon`, `zoom`, `pitch`, `bearing`
- Selected layers for the chapter
- Side scrolling behavior

### Block Template

```json
[
  ["jeo/storymap-chapter", {}],
  ["jeo/storymap-chapter", {}]
]
```

Storymap blocks are restricted to 1 per post.

## Frontend Rendering

### StoryMapDisplay Class

1. DOM scan: `.story-map-container`, `.storymap`
2. Lazy-init via `IntersectionObserver`
3. Creates shared MapLibre/Mapbox map
4. Uses `scrollama` for scroll-driven chapter navigation
5. Each chapter: `flyTo()` with center/zoom/pitch/bearing
6. Manages layer visibility per chapter
7. Optional final step: "Navigate the map" → full `JeoMap` instance

### Composed Mapbox Styles

Storymap renders `mapbox`-type layers via the **Map Style Composer** when available
(`fetchComposedStyleData(mapId)` → `loadComposedStyleData`). The composite style is set
as the map's base `style`; per-slide layer visibility delegates to
`setComposedLayerVisibility` via `getVisibilityLayerRefs()` (returns manifest layers).
Interactions and the composition-failure warning mirror `JeoMap`. The storymap editor
(`storymap-editor.js`) uses `useComposedMapPreviewStyle` + `applyComposedVisibilityFromSelection`
per slide. See [`composed-styles/README.md`](../composed-styles/README.md).

```mermaid
sequenceDiagram
    participant U as User
    participant S as Scrollama
    participant M as MapLibre Map

    U->>S: Scrolls to Chapter 1
    S->>M: flyTo({center, zoom, pitch, bearing})
    S->>M: setLayoutProperty(layers_ch1, visible)
    
    U->>S: Scrolls to Chapter 2
    S->>M: flyTo({center2, zoom2, ...})
    S->>M: setLayoutProperty(layers_ch1, none)
    S->>M: setLayoutProperty(layers_ch2, visible)
    
    U->>S: Scrolls to Final Chapter
    S->>M: Enables full interaction
    Note over M: "Navigate the map"
```

## Non-published Source Maps

The storymap editor map search (`storymap-editor.js` → `JeoAutosuggest showPrivate`)
surfaces private and scheduled maps, so a storymap can be composed from a map that
is not yet public. Rendering rules:

- Slides and layers render from the server-side payload regardless of the map's
  status (`get_post_meta` is not status-gated), so a published storymap built on a
  private map is fully visible to every visitor.
- The "Navigate the map" step is hidden while the source map is not published:
  `Jeo::story_map_dynamic_render_callback()` forces `navigateButton = false` in the
  payload, and the editor hides the checkbox with an explanatory note
  (editor↔frontend parity). The step returns automatically once the map is
  published — the block is dynamically rendered on every page load.
- Layers that are themselves private remain excluded everywhere
  (`layer_still_exists()` for slides; REST `view` context for the navigate map).

The embedded-storymap block and the map block keep their publish-only searches.

## Embed

Storymaps can be embedded via URL:
```
/embed/?map_id={storymap_id}
```

Template: `templates/embed-storymap.php`

## Webpack Entry Points

| Entry | File | Dependency |
|-------|------|------------|
| `jeoStorymap` | `jeo-storymap/storymap-display.js` | `jeoMap` |
