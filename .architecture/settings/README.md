# Settings & Admin

## Key Files

| File | Role |
|------|------|
| `src/includes/settings/class-settings.php` | `Jeo\Settings` class — 60+ options |
| `src/includes/settings/settings-page.php` | Settings page template |
| `src/includes/settings/settings-page.js` | Interactive JS (Select2, API tests) |
| `src/includes/settings/ai-logs-page.php` | AI cost dashboard |
| `src/includes/menu/class-menu.php` | Admin menu |
| `src/includes/admin/dashboard-page.php` | Geographic dashboard |
| `src/includes/admin/welcome-page.php` | Welcome/onboarding |

## Settings (Option `jeo-settings`)

All config in a single array option `jeo-settings`.

### Tabs

| Tab | Section | Key Fields |
|-----|---------|------------|
| General | Map runtime, post types | `map_runtime_requested`, `post_types`, `default_zoom`, `default_center`, `mapbox_key` |
| Geocoders | Geocoding service | `geocoding_service` |
| Appearance | Typography, colors | `font_family`, `font_url`, `primary_color`, `secondary_color` |
| Discovery | Discovery page | `discovery_page_id` |

### AI Settings (Separate tab under Jeo → AI)

| Tab | Keys |
|-----|------|
| Provider | `ai_provider`, `ai_{provider}_key`, `ai_{provider}_model` |
| Knowledge Base | `rag_auto_index`, `rag_post_types` |
| Bulk | `bulk_ai_enabled`, `bulk_ai_post_types`, `bulk_confidence_threshold` |
| Embedded Data | Reference to JSONs in `ai/data/` |

### Sanitization

- API keys: partial masking on display
- Checkboxes: explicit handling per tab (unchecked = absent)
- Colors: hex validation
- Sensitive keys: preserved when input is empty

## Admin Menu

```
Jeo
├── Welcome           (submenu: welcome)
├── Dashboard         (submenu: dashboard)
├── AI                (submenu: ai-settings)
│   └── AI Debug Logs (submenu: ai-logs)
├── Maps              (CPT: map)
├── Layers            (CPT: map-layer)
└── Storymaps         (CPT: storymap)
```

## Geographic Dashboard

Fullscreen page with:
- MapLibre/Mapbox map with all pins clustered
- Filter panel: search, post type, taxonomy, term, timeline range slider
- Fetches `/jeo/v1/all-pins` and `/jeo/v1/dashboard-stats`
- 721 lines of inline template

## Custom CSS

Settings allow defining primary/secondary colors and typography, injected via:
- `wp_head` → inline `<style>` with CSS custom properties
- `wp_enqueue_scripts` / `admin_enqueue_scripts` → Google Fonts

## Global Access

```php
$settings = jeo_settings(); // Returns singleton instance of Jeo\Settings
$value    = jeo_settings()->get_option( 'mapbox_key' );
```
