# Templates, Shortcodes & Embeds

## PHP Templates

| Template | Post Type | Description |
|----------|-----------|-------------|
| `templates/single-map.php` | `map` | Single map template |
| `templates/single-storymap.php` | `storymap` | Single storymap template |
| `templates/discovery.php` | Page | Discovery page template |
| `templates/embed.php` | — | Map iframe embed |
| `templates/embed-storymap.php` | — | Storymap iframe embed |
| `templates/embed-discovery.php` | — | Discovery iframe embed |
| `templates/map-content-layers-list.php` | `map` | Layer list below map |

### Template Override

Maps and Storymaps use `single_template` filter to load plugin templates:
- If the theme has `single-map.php`, the theme takes precedence
- Otherwise, uses the plugin template in `src/templates/`

### Discovery Page Template

Registered as page template via `theme_page_templates` filter. `discovery.php` renders:
1. `#discovery` container
2. Enqueues `discovery` + `jeoMap` assets

## EJS Templates (Popups)

| Template | Usage |
|----------|-------|
| `templates/generic-popup.ejs` | Generic map popup |
| `templates/post-popup.ejs` | Geolocated post popup |
| `templates/map-more-info.ejs` | Map "More Info" overlay |

Rendered via `eta` template engine in frontend JS (`jeo-map/template-compiler.js`).

## Shortcodes

### `[jeo-map]`

Registered in `Jeo\Maps::register_shortcode()`.

**Attributes:**
| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | int | Map ID (required) |

**Output:** `<div class="jeomap" data-map_id="{id}"></div>`

The frontend JS (`JeoMap`) detects and initializes automatically.

## Embed System

### Embed URLs

| Type | URL | Template |
|------|-----|----------|
| Map | `/embed/?map_id={id}` | `embed.php` |
| Storymap | `/embed/?map_id={storymap_id}` | `embed-storymap.php` |
| Discovery | `/embed/?discovery=1` | `embed-discovery.php` |

### Registration

Embeds are registered in `class-jeo.php`:
1. `query_vars` filter → adds `map_id`
2. `template_redirect` action → intercepts `/embed/` and loads template
3. Output buffering for clean iframe HTML

### oEmbed

Registered via `register_oembed()` for auto-embed of JEO URLs on other WordPress sites.

## Content Injection

### `the_content` Filter (Maps)

For `map` post type, content is replaced with:
1. `<div class="jeomap" data-map_id="{id}">`
2. Layer list (`map-content-layers-list.php`)
