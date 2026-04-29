# Stories Near You (`jeo/stories-near-you`)

Self-contained block in `src/includes/stories-near-you/class-stories-near-you.php`.

## Key Files

| File | Role |
|------|------|
| `src/includes/stories-near-you/class-stories-near-you.php` | Self-registering class: block type, REST endpoint, SQL query, rendering |
| `src/js/src/map-blocks/stories-near-you-editor.js` | Gutenberg edit component (InspectorControls + ServerSideRender) |
| `src/js/src/stories-near-you/stories-near-you-frontend.js` | Frontend: geolocation + REST fetch + DOM rendering |
| `src/css/stories-near-you.css` | Skeleton, grid, post card, responsive styles |

## Data Flow

```mermaid
sequenceDiagram
    participant PHP as render_callback
    participant HTML as Skeleton HTML
    participant JS as Frontend JS
    participant GEO as Browser Geolocation
    participant REST as /jeo/v1/stories-near-you
    participant DB as MySQL (ST_Distance_Sphere)

    PHP->>HTML: Outputs skeleton + data-attrs
    JS->>GEO: getLocation()
    alt Location obtained
        GEO-->>JS: {lat, lng}
    else Denied / unavailable
        GEO-->>JS: null
    end
    JS->>REST: GET with lat/lng (or empty)
    REST->>DB: UNION query with ST_Distance_Sphere
    alt No user coords
        REST->>REST: Fallback to JEO map center defaults
    end
    DB-->>REST: Post IDs sorted by distance
    REST-->>JS: {html: rendered grid}
    JS->>HTML: Replace skeleton with grid
```

## Location Resolution (3-tier fallback)

1. **Browser Geolocation API** → lat/lng sent to REST endpoint
2. _(future)_ **IP Geolocation** → resolved server-side from `$_SERVER['REMOTE_ADDR']`
3. **Map center defaults** → from JEO settings (`map_default_lat`, `map_default_lon`)

## Block Attributes

| Attribute | Type | Default | Purpose |
|-----------|------|---------|---------|
| `postsPerPage` | number | 6 | Total posts to display (max 36) |
| `postsPerRow` | number | 3 | Columns in grid (max 6) |
| `category` | number | 0 | Single category ID filter (0 = none) |
| `tag` | number | 0 | Single tag ID filter (0 = none) |
| `showThumbnail` | boolean | true | Toggle featured image |
| `showCategory` | boolean | true | Toggle category badge |
| `showDate` | boolean | true | Toggle post date |
| `showExcerpt` | boolean | true | Toggle excerpt |

## REST Endpoint

`GET /jeo/v1/stories-near-you`

Params: `lat`, `lng`, `postsPerPage`, `postsPerRow`, `category`, `tag`, `showThumbnail`, `showCategory`, `showDate`, `showExcerpt`

Returns: `{ html: "<div class=\"jeo-stories-near-you__grid\">...</div>" }`

## SQL Query

Uses `ST_Distance_Sphere()` to sort by proximity. UNION of primary (`_geocode_lat_p`/`_geocode_lon_p`) and secondary (`_geocode_lat_s`/`_geocode_lon_s`) coordinate indexes. Optional taxonomy JOINs for category/tag filtering. Deduplicates post IDs client-side.

## Webpack Entry

| Entry | File | Dependency |
|-------|------|------------|
| `storiesNearYou` | `stories-near-you/stories-near-you-frontend.js` | standalone |

## HTML Structure

```html
<div class="wp-block-jeo-stories-near-you">
  <div class="jeo-stories-near-you__grid jeo-stories-near-you__grid--cols-3">
    <article class="jeo-stories-near-you__post">
      <figure class="jeo-stories-near-you__post-featured-image">
        <a href="..."><img class="jeo-stories-near-you__post-image" ... /></a>
      </figure>
      <div class="jeo-stories-near-you__post-content">
        <span class="jeo-stories-near-you__post-terms">
          <span class="jeo-stories-near-you__post-term">Category</span>
        </span>
        <h3 class="jeo-stories-near-you__post-title">
          <a href="...">Post Title</a>
        </h3>
        <time class="jeo-stories-near-you__post-date" datetime="...">January 1, 2026</time>
        <p class="jeo-stories-near-you__post-excerpt">Excerpt text...</p>
      </div>
    </article>
  </div>
  <!-- Skeleton state -->
  <div class="jeo-stories-near-you__skeleton ...">...</div>
  <!-- Error state -->
  <div class="jeo-stories-near-you__error hidden">...</div>
  <!-- Block attributes for JS -->
  <script type="application/json" class="jeo-stories-near-you-attrs">{...}</script>
</div>
```

Inner elements use CSS `order` properties so themes can reorder thumbnail/category/title/date/excerpt via CSS.
