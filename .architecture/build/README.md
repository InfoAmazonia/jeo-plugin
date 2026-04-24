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
| Dependency review | `scripts/dependency-review.mjs` | License/security review |
| Version validate | `scripts/validate-release-meta.mjs` | Validates release metadata |
| PHP compat | `scripts/check-php-compat.php` | Checks PHP compatibility |
| Smoke test | `scripts/wordpress-smoke.sh` | WordPress smoke test |

## CI/CD (GitHub Actions)

| Workflow | File | Trigger |
|----------|------|---------|
| Node/Frontend | `node-frontend.yml` | Push/PR |
| PHPCS | `phpcs-wpcs.yml` | Push/PR |
| PHP Compat | `php-compat.yml` | Push/PR |
| WP Smoke | `wordpress-smoke.yml` | Push/PR |
| Deploy WP.org | `deploy-wordpress-org.yml` | Tag push |
| Docs | `docs-site.yml` | Push main |

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
