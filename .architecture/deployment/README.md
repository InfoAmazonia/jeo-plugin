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

## Activation/Deactivation

### Activation (`jeo_activate`)
- Registers CPTs
- Flushes rewrite rules

### Deactivation (`jeo_deactivate`)
- Clears configured API keys
- Clears debug logs
- Flushes rewrite rules
