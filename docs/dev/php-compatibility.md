# PHP Compatibility

This repository keeps two layers of PHP compatibility validation:

- Static compatibility checks for PHP `8.0` through `8.5`.
- WordPress smoke tests for the PHP and WordPress combinations we currently support or monitor.

## Policy snapshot

Validated on May 21, 2026.

- Primary support: PHP `8.2`, `8.3`, and `8.4`.
- Experimental monitoring: PHP `8.5`.
- Stable WordPress gate: `WordPress 7.0` on PHP `8.2`, `8.3`, and `8.4`.
- Experimental WordPress gate: `WordPress 7.0` on PHP `8.5`.
- Backward-compatibility coverage: `WordPress 6.6` on PHP `8.0` and `8.1`.

## Automation

- Static checks: `.github/workflows/php-compat.yml`
- WordPress smoke tests: `.github/workflows/wordpress-smoke.yml`

## How PHP 8.5 is covered

- `phpcs-compat.xml.dist` runs PHPCompatibilityWP against the plugin source with `testVersion` set to PHP `8.0-8.5`.
- `.github/workflows/php-compat.yml` runs that PHPCompatibilityWP ruleset as the repository's static PHP compatibility gate.
- `.github/workflows/wordpress-smoke.yml` includes one experimental PHP `8.5` smoke job for `WordPress 7.0`.
- `scripts/wordpress-smoke.sh` honors `WP_CLI_PHP`, so the same runtime smoke can be executed against PHP `8.5` locally.
- Stable `wp-cli` support for PHP `8.5` is still planned upstream. That mismatch is why PHP `8.5` remains experimental in this repository's CI policy.

## Local commands

Run the static PHP compatibility checks locally:

```bash
composer install --no-interaction --no-progress --prefer-dist
vendor/bin/phpcs --standard=phpcs-compat.xml.dist
```

Run the WordPress smoke test locally with an explicit PHP runtime:

```bash
WP_CLI_PHP=/opt/homebrew/opt/php@8.4/bin/php \
WP_DB_HOST=localhost \
WP_DB_NAME=wordpress \
WP_DB_USER=your-user \
WP_DB_PASSWORD='' \
WP_VERSION=7.0 \
bash scripts/wordpress-smoke.sh
```

The smoke script now honors `WP_CLI_PHP` directly, which avoids Homebrew `wp` defaulting to the active `php` binary in `PATH`.
The repository itself is currently clean under PHP `8.5`, but `wp-cli` 2.12.0 still emits third-party deprecation noise there, so PHP `8.5` remains an experimental runtime line.

## Current status

- PHPCompatibilityWP static checks are green for PHP `8.0` through `8.5`.
- Local WordPress smoke on PHP `8.5` passes, but still logs third-party deprecations from `wp-cli` and its bundled libraries.
- Keep PHP `8.5` experimental in CI until those third-party logs stop obscuring runtime signal.
