# WordPress.org Deployment

## Process

Deployment is automated via GitHub Actions (`deploy-wordpress-org.yml`) on tag push.

## .wordpress-org/ Assets

| File | Description |
|------|-------------|
| `banner-772x250.png` | Plugin page banner |
| `icon-128x128.png` | Plugin icon |
| `screenshot-*.png` | Screenshots (7 screenshots) |

## WP.org Compliance

The `check-wporg-compliance.mjs` script verifies:
- No disallowed files/binaries
- GPL-compatible license
- Correct plugin headers
- No phoning home
- Assets in correct paths

## Versioning

Version is synced in 3 places via `sync-plugin-version.mjs`:
1. `package.json` → `version`
2. `src/jeo.php` → `JEO_VERSION` constant
3. `src/readme.txt` → `Stable tag`

## Release Structure

The plugin is deployed as the contents of `src/` (not repo root):
- `src/` contains the complete WordPress plugin
- `node_modules/`, `scripts/`, `docs/` are not deployed
- `src/js/build/` (compiled) is included
- `src/vendor/` (composer) is included if present
- `src/includes/vendor/` (bundled third-party assets such as Select2) is included

## Activation/Deactivation

### Activation (`jeo_activate`)
- Registers CPTs
- Flushes rewrite rules

### Deactivation (`jeo_deactivate`)
- Clears configured API keys
- Clears debug logs
- Flushes rewrite rules

### Uninstall (`uninstall.php`)
- Deletes `jeo-settings` option
- Deletes `jeo_bulk_ai_cron_logs` and `jeo_ai_embedding_tokens` options
- Clears scheduled cron hooks (`jeo_bulk_ai_cron_hook`, `jeo_bulk_ai_clear_cron_hook`)
- Deletes all `jeo-ai-log` posts
- Deletes all geolocation post meta (`_related_point`, `_geocode_*`)
- Deletes Nominatim transients
- Removes RAG vector store directory (`wp-content/uploads/jeo-ai-store/`)

### Uninstall Confirmation Page

To prevent accidental data loss, the plugin overrides the default **Delete** link on `plugins.php` with a confirmation screen (`admin.php?page=jeo-uninstall-confirm`). This screen lists every type of data that will be removed and requires the user to check an explicit acknowledgment before proceeding.},{
