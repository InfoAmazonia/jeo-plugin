# REST API

## Custom Endpoints

All registered in `class-jeo.php` and `class-ai-handler.php` via `rest_api_init`.

### Maps & Layers

| Route | Method | Callback | Description |
|-------|--------|----------|-------------|
| `/jeo/v1/map-layer` | GET | `get_layers` | List layers with search |
| `/jeo/v1/all-pins` | GET | `get_all_pins` | All geolocated points |
| `/jeo/v1/dashboard-stats` | GET | `get_dashboard_stats` | Dashboard statistics |

### Composed Mapbox Styles

Registered by `Map_Style_Composer` (`class-map-style-composer.php`). See
[`composed-styles/README.md`](../composed-styles/README.md) for the full architecture.

| Route | Method | Permission | Description |
|-------|--------|------------|-------------|
| `/jeo/v1/map-style/{id}` | GET | `can_read_map` | Composed style metadata (style/manifest URLs, warnings). Arg `refresh` forces regeneration |
| `/jeo/v1/map-style/{id}/style` | GET | `can_read_map` | Serves `style.json` (composite Mapbox Style v8) |
| `/jeo/v1/map-style/{id}/manifest` | GET | `can_read_map` | Serves `manifest.json` (layer ID → composite layer ID mapping) |
| `/jeo/v1/map-style/compose` | POST | `can_create_virtual` | Compose from payload (scope/kind/postId/layers). `onetime`=public, `preview`=`edit_posts` |
| `/jeo/v1/map-style/layer/{id}/refresh` | POST | `can_refresh_layer` | Force-regenerate all maps referencing a layer |
| `/jeo/v1/map-style/{scope}/{hash}/style` | GET | `can_read_virtual` | Virtual (preview/onetime) style artifact |
| `/jeo/v1/map-style/{scope}/{hash}/manifest` | GET | `can_read_virtual` | Virtual (preview/onetime) manifest artifact |

### AI (12+ routes)

See [`ai/README.md`](../ai/README.md) for full details.

### Minilayer

| Route | Method | Description |
|-------|--------|-------------|
| `/jeo/v1/minilayer/generate` | POST | Generate Mapbox style from text prompt and create JEO layer |

### Minimap (AI-Assisted Map)

| Route | Method | Callback | Description |
|-------|--------|----------|-------------|
| `/jeo/v1/minimap/setup` | POST | `api_setup` | Generate map from post content (RAG + post geopoints) |
| `/jeo/v1/minimap/setup-prompt` | POST | `api_setup_prompt` | Generate map from text prompt via AI agent |
| `/jeo/v1/minimap/chat` | POST | `api_chat` | Multi-turn map refinement via AI agent (requires `conversation_id`) |

### AI Context (Editorial Suggestions)

| Route | Method | Callback | Description |
|-------|--------|----------|-------------|
| `/jeo/v1/context/setup` | POST | `api_setup` | Generate initial editorial suggestions from post content |
| `/jeo/v1/context/chat` | POST | `api_chat` | Multi-turn conversation for refining suggestions (requires `conversation_id`) |
| `/jeo/v1/context/state` | GET | `api_get_state` | Load persisted conversation state (messages, suggestions, conversation_id) |
| `/jeo/v1/context/clear` | POST | `api_clear` | Reset conversation and all suggestions |

### Dashboard

| Route | Method | Description |
|-------|--------|-------------|
| `/jeo/v1/all-pins` | GET | GeoJSON with all geolocated post points |
| `/jeo/v1/dashboard-stats` | GET | Counts of maps, layers, geolocated posts |
| `/jeo/v1/readme` | GET | README content for welcome page |

## CPT REST (Standard WordPress)

| CPT | Base Route | Notes |
|-----|-----------|-------|
| `map` | `/wp/v2/map` | Metafields exposed via REST schema |
| `map-layer` | `/wp/v2/map-layer` | No `per_page` max limit |
| `storymap` | `/wp/v2/storymap` | Enriched with co-author data |
| `jeo-ai-log` | Private (not exposed) | Internal cost tracking |

## REST Authentication

- Cookie auth: `rest_request_before_callbacks` filter injects cookie auth
- Nonce: standard `wp_rest` nonce
- Capabilities: Checked via `current_user_can()` on mutations

## Custom REST Filters

| Filter | Hook | Description |
|--------|------|-------------|
| `rest_map-layer_query` | `custom_layer_search_filters` | Search by title in layers |
| `rest_map-layer_query` | `order_rest_post_by_post_title` | Order by title |
| `rest_post_tag_query` | `maximum_terms_api_filter` | Limit terms in API |
| `rest_post_query` | `meta_query` passthrough | Filter posts by meta |

## Response Enrichment

### Maps

`rest_prepare_map` → Injects block editor preview HTML into REST response.

### Layers

`rest_prepare_map-layer` → Injects block editor preview HTML into REST response.

### Storymaps

`rest_prepare_storymap` → Adds co-author data to response.

## Meta Validation

The `Rest_Validate_Meta` trait intercepts `rest_pre_insert_{post_type}` and calls `validate_meta_{key}` for each registered meta key. Example:

```php
protected function validate_meta_initial_zoom( $value ) {
    return ( $value >= 1 && $value <= 14 ) ? $value : new WP_Error( ... );
}
```
