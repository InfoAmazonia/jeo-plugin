# JEO

The JEO plugin acts as a geojournalism platform that allows news organizations, bloggers and NGOs to publish news stories as layers of information on digital maps.

With JEO, creating the interaction between data layers and contextual information is intuitive and interactive. You can post geotagged stories and create richly designed pages for each one of the featured stories.

At the same time, by simply imputing the ids of layers hosted on [Mapbox](https://www.mapbox.com/), you can manage sophisticated maps without losing performance, add legends directly with HTML and set the map parameters. All directly at the WordPress dashboard.

## Compatibility

This repository currently declares `Requires PHP: 8.0`, with primary validation focused on PHP `8.2` to `8.4` and experimental monitoring on PHP `8.5`.
The frontend runtime targets Node `24` as the supported project baseline.

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
- `scripts/check-node-version.mjs` enforces the supported frontend runtime before `npm ci` or `npm install` continue.
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
For local frontend work, use Node `24`.
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

## Building the plugin

The plugin root for local development and release packaging is `src/`.
Builds compile JavaScript and CSS assets into `src/js/build`.

Use these commands during local development:

```bash
npm run start
npm run build
```

- `npm run start` watches the source tree and rebuilds assets while you develop.
- `npm run build` performs a production build and regenerates JavaScript translation JSON catalogs in `src/languages`.

To generate JavaScript translation JSON catalogs on their own, run:

```bash
npm run i18n:json
```

These scripts expect `wp` (WP-CLI) to be available on your `PATH`. If it lives elsewhere, set `WP_CLI_BIN` when running the command.
The generated `src/languages/*.json` catalogs are release artifacts and are intentionally not versioned in Git.

If you prefer copying files instead of symlinking them into a local WordPress install, use:

```bash
rsync --archive --progress --human-readable --delete ./src/ /path/to/wordpress/wp-content/plugins/jeo/
```

## Releasing

WordPress.org releases are built from `src/`, not from the repository root.
The deploy workflow also publishes assets from `.wordpress-org/`.
When a stable release tag is pushed, the workflow also creates a GitHub Release
that keeps GitHub's source-code archives and attaches a built `jeo.zip`
artifact generated from `src/`.

Prerelease branches may carry a SemVer prerelease such as `3.0.0-rc.3` while
WordPress.org stays on the latest stable release. Before creating a stable
release tag, run `npm run sync:version` and keep these files aligned:

- `src/jeo.php`
- `src/readme.txt`
- `package.json`
- `package-lock.json`
- `.wordpress-org/`

The deploy workflow now validates that:

- the plugin version in `src/jeo.php` matches `JEO_VERSION`
- `package.json` and the root package entry in `package-lock.json` match the plugin version
- the `Stable tag` in `src/readme.txt` matches the plugin version for the tagged stable release
- the release tag is a stable `x.y.z` version
- the built release tree from `src/` passes WordPress Plugin Check when staged as `jeo/`

Pre-release tags such as `-rc` are intentionally blocked from the WordPress.org deploy pipeline.
Stable tag releases only proceed to WordPress.org deployment after Plugin Check passes; a failing check blocks the release before any publish step runs.

Release validation and packaging should use:

```bash
npm ci
npm run build
```

The attached `jeo.zip` mirrors the WordPress.org deploy package: it contains
the built contents of `src/` under the `jeo/` plugin slug directory, ready for
manual installation in WordPress.

## Documentation

The documentation source lives in `docs/`.
The published static site lives in `site/` and is generated with MkDocs.

To rebuild it locally:

```bash
python3 -m pip install -r requirements-docs.txt
python3 -m mkdocs build --clean
```

Changes to `docs/`, `mkdocs.yml` or `requirements-docs.txt` on `master` automatically regenerate and commit `site/` through `.github/workflows/docs-site.yml`.
