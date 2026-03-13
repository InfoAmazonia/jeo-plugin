# PHP Compatibility

This repository keeps two layers of PHP compatibility validation:

- Static compatibility checks for PHP `8.0` through `8.4`.
- WordPress smoke tests for the PHP and WordPress combinations we currently support or monitor.

## Policy snapshot

Validated on March 13, 2026.

- Primary support: PHP `8.2`, `8.3`, and `8.4`.
- Stable WordPress gate: `WordPress 6.9.4` on PHP `8.2`, `8.3`, and `8.4`.
- Backward-compatibility coverage: `WordPress 6.6` on PHP `8.0` and `8.1`.
- Forward-compatibility coverage: `WordPress 7.0-beta4` on PHP `8.2`, `8.3`, and `8.4`.

## Automation

- Static checks: `.github/workflows/php-compat.yml`
- WordPress smoke tests: `.github/workflows/wordpress-smoke.yml`

## Local commands

Run the static checks with the PHP binary you want to validate:

```bash
/opt/homebrew/opt/php@8.0/bin/php scripts/check-php-compat.php
/opt/homebrew/opt/php@8.1/bin/php scripts/check-php-compat.php
/opt/homebrew/opt/php@8.2/bin/php scripts/check-php-compat.php
/opt/homebrew/opt/php@8.3/bin/php scripts/check-php-compat.php
/opt/homebrew/opt/php@8.4/bin/php scripts/check-php-compat.php
```

Run the WordPress smoke test locally with an explicit PHP runtime:

```bash
WP_CLI_PHP=/opt/homebrew/opt/php@8.4/bin/php \
WP_DB_HOST=localhost \
WP_DB_NAME=wordpress \
WP_DB_USER=your-user \
WP_DB_PASSWORD='' \
WP_VERSION=7.0-beta4 \
bash scripts/wordpress-smoke.sh
```
