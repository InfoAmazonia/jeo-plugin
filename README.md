# JEO

The JEO plugin acts as a geojournalism platform that allows news organizations, bloggers and NGOs to publish news stories as layers of information on digital maps.

With JEO, creating the interaction between data layers and contextual information is intuitive and interactive. You can post geotagged stories and create richly designed pages for each one of the featured stories.

At the same time, by simply imputing the ids of layers hosted on [Mapbox](https://www.mapbox.com/), you can manage sophisticated maps without losing performance, add legends directly with HTML and set the map parameters. All directly at the WordPress dashboard.

## Compatibility

This repository currently declares `Requires PHP: 8.0`, with primary validation focused on PHP `8.2` to `8.4` and experimental monitoring on PHP `8.5`.
The frontend runtime now targets Node `24` as the project default, with Node `20` kept only as a transition line while CI and lockfile validation still cover both runtimes.

Compatibility snapshot validated on March 17, 2026:

- Primary support: PHP `8.2`, `8.3`, and `8.4`.
- Experimental monitoring: PHP `8.5`.
- Stable WordPress gate: `WordPress 6.9.4` on PHP `8.2`, `8.3`, and `8.4`.
- Experimental WordPress gate: `WordPress 6.9.4` on PHP `8.5`.
- Backward-compatibility smoke tests: `WordPress 6.6` on PHP `8.0` and `8.1`.
- Forward-compatibility smoke tests: `WordPress 7.0-beta4` on PHP `8.2`, `8.3`, `8.4`, and experimentally on `8.5`.

Automation:

- Frontend asset checks run in `.github/workflows/node-frontend.yml`.
- Static PHP checks run in `.github/workflows/php-compat.yml`, including an experimental PHP `8.5` job.
- WordPress runtime smoke tests run in `.github/workflows/wordpress-smoke.yml`, including experimental PHP `8.5` jobs for `WordPress 6.9.4` and `WordPress 7.0-beta4`.

Test script coverage:

- `scripts/check-php-compat.php` now validates repository-owned compatibility from PHP `8.0` through `8.5`, including PHP `8.5`-specific deprecation heuristics.
- `scripts/wordpress-smoke.sh` can be forced onto PHP `8.5` with `WP_CLI_PHP`, so the plugin's runtime smoke can be exercised on that line locally and in CI.
- `scripts/check-node-version.mjs` enforces the supported frontend runtimes before `npm ci` or `npm install` continue.
- `scripts/report-bundle-sizes.mjs` enforces explicit bundle budgets instead of relying on generic webpack performance warnings.

Local commands:

```bash
nvm use
npm run check:env
npm ci
npm run build
npm run build:report
npm run test:unit
npm run audit:npm
composer audit --locked
php scripts/check-php-compat.php
/opt/homebrew/opt/php@8.5/bin/php scripts/check-php-compat.php

WP_CLI_PHP=/opt/homebrew/opt/php@8.4/bin/php \
WP_DB_HOST=localhost \
WP_DB_NAME=wordpress \
WP_DB_USER=your-user \
WP_DB_PASSWORD='' \
WP_VERSION=7.0-beta4 \
bash scripts/wordpress-smoke.sh
```

`scripts/wordpress-smoke.sh` honors `WP_CLI_PHP`, which is useful on Homebrew installs where `/opt/homebrew/bin/wp` otherwise follows the default `php` in `PATH`.
For local frontend work, prefer Node `24`. Node `20` remains accepted only during the transition window tracked in CI.
Use PHP `8.5` for local smoke only when you specifically want to inspect the experimental runtime line. WordPress core 6.9 treats PHP `8.5` as beta support, while stable `wp-cli` support for PHP `8.5` is still planned upstream and `wp-cli` 2.12.0 still emits third-party deprecation noise there.

## Setting up local environment

First of all, clone this repository.
Note that you can NOT clone it directly in the WordPress `plugins` directory.

```bash
git clone git@github.com:InfoAmazonia/jeo-plugin.git
```

Set up a WordPress installation. This could be a dedicated installation to develop Jeo or you can use an existing instance you have.
(Note: This plugin requires WordPress 6.6+)

Then create a symbolic link inside of `wp-content/plugins/jeo` pointing to the `src` folder in this repository.

```bash
ln -s /path/to/jeo-plugin/src /path/to/wordpress/wp-content/plugins/jeo
```

### Build

When we want to build the plugin, we run `npm run build` to compile all the assets (css and js) to `src/js/build`.
While developing, you might want to run `npm run watch`. This script will watch your development folder for changes and automatically build the plugin so you don't have to do it manually every time you modify a file.

```bash
rsync --archive --progress --human-readable --delete .src/ /path/to/wordpress/wp-content/plugins/jeo
```
