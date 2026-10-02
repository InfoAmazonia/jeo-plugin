# Build System & Scripts

## Commands

| Command | Description |
|---------|-------------|
| `npm start` | Dev server (webpack watch) |
| `npm run build` | Production build + i18n JSON |
| `npm run build:assets` | Webpack production build |
| `npm run build:report` | Bundle size report |
| `npm run test:unit` | Jest tests |
| `npm run i18n:json` | Generate translation JSON |
| `npm run audit:npm` | npm security audit |
| `npm run audit:composer` | Composer security audit |
| `npm run deps:report` | Dependency report |
| `composer install` | Install PHP deps (phpcs) |

## Lint

| Command | Tool | Config |
|---------|------|--------|
| `vendor/bin/phpcs` | PHPCS (WPCS) | `phpcs.xml.dist` |
| (via wp-scripts) | ESLint + Prettier | `@wordpress/scripts` defaults |

## Webpack Config

File: `webpack.config.js`

Extends `@wordpress/scripts/config/webpack.config` with:
- Custom entry points (see [frontend/README.md](../frontend/README.md))
- Output in `src/js/build/`
- `splitChunks: false` (each entry is independent)
- `chunkIds: 'named'`
- `NormalModuleReplacementPlugin` to strip `node:` prefix
- Fallbacks: `fs: false`, `path: false`

## Helper Scripts

| Script | File | Description |
|--------|------|-------------|
| Version sync | `scripts/sync-plugin-version.mjs` | Syncs package.json version → readme.txt/jeo.php |
| Node check | `scripts/check-node-version.mjs` | Validates Node.js >= 24 |
| Build compliance | `scripts/patch-build-compliance.mjs` | Post-build patches for WP.org compliance |
| i18n JSON | `scripts/make-i18n-json.mjs` | Generates translation JSON |
| Bundle report | `scripts/report-bundle-sizes.mjs` | Reports bundle sizes |
| WP.org check | `scripts/check-wporg-compliance.mjs` | Checks WP.org compliance |
| PHP compat | `scripts/check-php-compat.php` | Checks PHP 8.0-8.5 compatibility |
| Smoke test | `scripts/wordpress-smoke.sh` | WordPress smoke test |

## Local Development Environment (Docker)

A self-contained Docker environment lives in `.docker/` (gitignored) and is **not** committed to the repository.

```bash
bash .docker/start.sh   # Start WordPress + MariaDB
```

| Service | Container Name | Host Port | Credentials |
|---------|---------------|-----------|-------------|
| WordPress | `jeo-dev-wordpress` | `8081` | Setup wizard on first run |
| MariaDB | `jeo-dev-mariadb` | `3307` | `jeo` / `jeo` / `jeo` |

- `src/` is mounted live into `/var/www/html/wp-content/plugins/jeo` — no reinstall needed after edits.
- Network: `jeo-dev-network` (isolated bridge).
- Stop: `docker compose -f .docker/docker-compose.yml down`
| Dependency review | `scripts/dependency-review.mjs` | License/security review |
| Version validate | `scripts/validate-release-meta.mjs` | Validates release metadata |
| PHP compat | `scripts/check-php-compat.php` | Checks PHP compatibility |
| Smoke test | `scripts/wordpress-smoke.sh` | WordPress smoke test |

## Release Build Scripts

All release/packaging logic is consolidated to avoid duplication. Shared
helpers (logging, Node 24 check with nvm fallback, version extraction, ZIP
packaging) live in **`scripts/lib/common.sh`**, which the entry-point scripts
source.

| Script | Role |
|--------|------|
| `scripts/lib/common.sh` | Shared functions: `step/ok/warn/fail`, `jeo_plugin_version`, `jeo_ensure_node_24`, `jeo_create_zip`. Sourced, not executed. |
| `scripts/build.sh` | **Canonical release builder.** Node check → validate metadata → composer (prod) → assets → i18n → `dist/jeo-{version}.zip`. Flags: `--skip-assets`, `--skip-composer`, `--skip-i18n`, `--skip-build`. |
| `scripts/install-and-build.sh` | Clean reinstall (wipes `node_modules` + `vendor` root/src, `npm ci`, composer), then delegates build+zip to `build.sh --skip-composer`. Flag: `--no-zip`. |
| `scripts/build-wordpress-zip.sh` | Deprecated thin alias that `exec`s `build.sh` (same flags). |

**Node 24 enforcement:** `jeo_ensure_node_24` loads nvm and switches to Node 24
*before* any npm step runs (so the build never hits `EBADDEVENGINES`).
`scripts/check-node-version.mjs` is the JS-side assertion of the Node 24.x
requirement, used after the switch.

## CI/CD (GitHub Actions)

| Workflow | File | Trigger |
|----------|------|---------|
| Node/Frontend | `node-frontend.yml` | Push/PR |
| PHPCS | `phpcs-wpcs.yml` | Push/PR |
| PHP Compat | `php-compat.yml` | Push/PR |
| WP Smoke | `wordpress-smoke.yml` | Push/PR |
| Deploy WP.org | `deploy-wordpress-org.yml` | Tag push |
| Site (landing + docs) → gh-pages | `deploy-site.yml` | Push master |

## Project Website (site/)

Two independent builds published together under one origin (`jeowp.org`):

- **Landing** — React + Vite, source in `landing-page/`, built to `site/` (Vite `outDir`; `LANDING_OUT_DIR` overrides it). `LANDING_BASE=/subpath` produces a homolog build under a subpath.
- **Docs** — VitePress, source in `docs/`, built to `site/docs/`.

Cross-navigation: the landing links into the docs via `landing-page/src/links.js` (`DOCS_URL = '/docs/'`); the docs navbar logo links back to the landing (`themeConfig.logoLink`).

### Site commands

| Command | Purpose |
|---|---|
| `npm run dev:site` | Both dev servers under one origin: http://localhost:5173 (landing, HMR) + `/docs/` (VitePress dev, proxied by the landing dev server) |
| `npm run build:site` | Installs deps and builds both parts into `site/` (landing, then docs) |
| `npm run preview:site` | Serves the built `site/` at http://localhost:4174 |
| `npm --prefix docs run docs:dev` | Docs dev server only |
| `npm --prefix docs run docs:build` | Docs production build only (into `site/docs/`) |
| `LANDING_BASE=/novo npm --prefix landing-page run build` | Landing build under a subpath (homolog) |

> Caveat: `preview:site` uses Python's `http.server`, which does not resolve extensionless URLs — `/docs/concepts` 404s locally while GitHub Pages serves it from `concepts.html`. Verify extensionless docs URLs on the deployed site (or request the `.html` locally).

### Documentation conventions (docs/)

- **Stack**: VitePress with `base: '/docs/'`, `cleanUrls: true`, `srcExclude: ['README.md']` (repo-only index). Output goes straight to `site/docs/` (`outDir`, `emptyOutDir`).
- **Structure**: flat source pages — `docs/*.md` and `docs/dev/*.md`; the home is `docs/index.md`. No rewrites: every page builds to flat `x.html` and is served at the extensionless URL `/docs/x` (GitHub Pages resolves `/x` → `x.html`). Legacy trailing-slash URLs (`/docs/x/`, MkDocs era) are not served.
- **Internal links**: relative `.md` anchors in natural source-space form — the same path you would use to open the target file from the linking page:
  - root → root: `[AI Settings](ai-settings.md)`
  - root → dev: `[Geocoders](dev/geocoders.md)`
  - dev → dev sibling: `[Geocoders](geocoders.md)`
  - dev → root: `[AI Settings](../ai-settings.md)`
  - home → page: `[Read documentation](index-plugin.md)`
- **Why relative `.md`**: VitePress fails the build on dead links for `.md`/`.html` targets only — absolute links (`/page/`) bypass the check. Relative anchors also resolve when browsing the repo on GitHub.
- **Images**: shared `docs/img/` directory, referenced relatively (`![alt](img/foo.png)`) — valid because pages stay flat.
- **Publishing**: `deploy-site.yml` builds the complete site (landing + docs) on every push to `master` and deploys it to the `gh-pages` branch. `site/` is gitignored. Builds are deterministic (content-hashed assets are stable across builds).

## Node.js

- **Required version**: 24+ (see `.nvmrc`)
- **npm**: >= 10

## Output Structure

```
src/js/build/
├── mapglLoader.js
├── mapglReact.js
├── jeoMap.js
├── jeoStorymap.js
├── discovery.js
├── mapBlocks.js
├── layersSidebar.js
├── mapsSidebar.js
├── postsSidebar.js
├── JeoLayer.js
└── JeoLegend.js
```
