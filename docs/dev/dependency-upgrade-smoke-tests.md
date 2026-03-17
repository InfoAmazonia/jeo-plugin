# Dependency Upgrade Smoke Tests

Use this checklist for both the completed stabilization track and the current plugin sanity track. The dependency report keeps both rounds documented; approvals should follow the batch sequence that matches the active round.

## Approval package

- Summarize the dependencies, lockfiles and source files touched by the batch.
- Update `docs/dev/dependency-upgrade-report.json`, `docs/dev/dependency-upgrade-report.md` and this checklist.
- Record automated check results in the report `executionLog`.
- List only the manual review items that apply to the current batch.
- Ask for approval before creating a commit.

## Preconditions

- Use a WordPress instance that matches the current baseline: WordPress 6.6+, PHP 8.0+, Node 24 as the supported frontend runtime.
- At the start of every dependency review or planning batch that can touch editor or runtime behavior, regenerate the dependency report and record the resolved React, ReactDOM and Gutenberg editor package versions plus peer ranges from the frontend runtime snapshot.
- Test both editor and frontend behavior whenever a batch touches runtime code.
- Treat `.github/workflows/node-frontend.yml`, `.github/workflows/php-compat.yml` and `.github/workflows/wordpress-smoke.yml` as the mandatory CI gates.
- Run `npm run check:env` before local installs or frontend checks so unsupported Node versions fail early.
- When the local WordPress smoke runs from a clean worktree, make sure the ignored `src/js/build` assets have been generated first, or record the resulting asset-include warnings explicitly in the batch report.
- If the local WordPress smoke script cannot complete because the machine is missing the expected database or wp-cli runtime setup, record the failure details in the batch report and use the GitHub workflow as the authoritative runtime gate.
- Treat a blocked evaluation as a valid batch outcome only after recording the blocker, the evidence and the next step in the report.

## Automated checks by batch

- Batch 0: run `composer validate --no-check-publish`, `php scripts/check-php-compat.php`, `WP_CLI_PHP=/opt/homebrew/opt/php@8.4/bin/php WP_DIR=/tmp/jeo-plugin-wordpress-smoke bash scripts/wordpress-smoke.sh`, `node --check scripts/dependency-review.mjs` and `node scripts/dependency-review.mjs --write`.
- Batch 1: run `npm ci`, `npm run build`, `npm run test:unit`, `php scripts/check-php-compat.php` and `WP_CLI_PHP=/opt/homebrew/opt/php@8.4/bin/php WP_DIR=/tmp/jeo-plugin-wordpress-smoke bash scripts/wordpress-smoke.sh`.
- Batch 1: after `npm run build`, also run `npm run build:report` and `npm run audit:npm`.
- Batch 2: run `npm ci`, `npm run build`, `npm run test:unit`, `php scripts/check-php-compat.php` and `WP_CLI_PHP=/opt/homebrew/opt/php@8.4/bin/php WP_DIR=/tmp/jeo-plugin-wordpress-smoke bash scripts/wordpress-smoke.sh`.
- Batch 3: run `npm ci`, `npm run build`, `npm run test:unit`, `php scripts/check-php-compat.php` and `WP_CLI_PHP=/opt/homebrew/opt/php@8.4/bin/php WP_DIR=/tmp/jeo-plugin-wordpress-smoke bash scripts/wordpress-smoke.sh`.
- Batch 4: run `npm ci`, `npm run build`, `npm run test:unit`, `npm ls react-autosize-textarea react react-dom`, `php scripts/check-php-compat.php` and `WP_CLI_PHP=/opt/homebrew/opt/php@8.4/bin/php WP_DIR=/tmp/jeo-plugin-wordpress-smoke bash scripts/wordpress-smoke.sh`.
- Batch 5: run `npm ci`, `npm run build`, `npm run test:unit`, `php scripts/check-php-compat.php` and `WP_CLI_PHP=/opt/homebrew/opt/php@8.4/bin/php WP_DIR=/tmp/jeo-plugin-wordpress-smoke bash scripts/wordpress-smoke.sh`.
- Batch 6: run `composer validate --no-check-publish`, `php scripts/check-php-compat.php` with PHP `8.0` through `8.5`, the local WordPress smoke on PHP `8.4`, and the local WordPress smoke on PHP `8.5`, recording any third-party `wp-cli` deprecation noise separately from repository-owned warnings.
- Batch 7: run `composer validate --no-check-publish`, `php scripts/check-php-compat.php`, `vendor/bin/phpcs --standard=phpcs.xml.dist`, and `WP_CLI_PHP=/opt/homebrew/opt/php@8.4/bin/php WP_DIR=/tmp/jeo-plugin-wordpress-smoke bash scripts/wordpress-smoke.sh` if runtime-touching PHP files changed.
- Sanity Batch 0: run `npm run check:env`, `npm ci`, `npm run build`, and `npm run build:report`.
- Sanity Batch 1: run `npm ci`, `npm audit --package-lock-only`, `npm audit --omit=dev`, and `composer audit --locked`.
- Sanity Batch 2: run `npm ci`, `npm run test:unit`, `npm run build`, `php scripts/check-php-compat.php`, and `WP_CLI_PHP=/opt/homebrew/opt/php@8.4/bin/php WP_DIR=/tmp/jeo-plugin-wordpress-smoke bash scripts/wordpress-smoke.sh`.
- Sanity Batch 3: run `npm run test:unit`, `npm run build`, and `npm run build:report`.
- Sanity Batch 4: run `npm run test:unit`, `npm run build`, and `php scripts/check-php-compat.php`.
- Sanity Batch 5: run `php scripts/check-php-compat.php`, `vendor/bin/phpcs --standard=phpcs.xml.dist`, and `WP_CLI_PHP=/opt/homebrew/opt/php@8.4/bin/php WP_DIR=/tmp/jeo-plugin-wordpress-smoke bash scripts/wordpress-smoke.sh`.
- Sanity Batch 6: run `npm ci`, `npm run test:unit`, `npm run build`, `npm run build:report`, `npm audit --package-lock-only`, `composer validate --no-check-publish`, `composer audit --locked`, `php scripts/check-php-compat.php`, `vendor/bin/phpcs --standard=phpcs.xml.dist`, and `WP_CLI_PHP=/opt/homebrew/opt/php@8.4/bin/php WP_DIR=/tmp/jeo-plugin-wordpress-smoke bash scripts/wordpress-smoke.sh`.
- Sanity Batch 7: run `node scripts/dependency-review.mjs --write`, `npm audit --package-lock-only`, and `npm ls react-autosize-textarea react react-dom` while reviewing the active `overrides` inventory.

## Manual review by batch

- Batch 0: no product review is required.
- Batch 1: verify published-map popups, same-point post individualization, the absence of the null-geocode crash, and storymap slide plus nested layer reorder, including save and reopen after reordering.
- Batch 2: verify geocoding autosuggest suggestions and selection, post/map autosuggest insertion, Discovery date apply/clear behavior, and layer or attribution forms backed by schema data.
- Batch 3: verify selected map-layer ordering, storymap slide ordering and storymap layer toggling after removing the unsupported nested drag affordance.
- Batch 4: verify editor loading, save flows and console cleanliness in the map editor, layer editor, storymap editor and regular post editor after the local react-autosize-textarea override and lockfile refresh.
- Batch 5: verify add, edit, drag, cancel, save and reopen flows in the geocoding sidebar map.
- Batch 6: verify the same product smoke already covered by the runtime batches, but execute it while watching specifically for repository-owned PHP 8.5 warnings or deprecations instead of third-party `wp-cli` noise.
- Batch 7: no dedicated product review is required unless the PHPCS cleanup changes runtime PHP logic; otherwise review the lint delta, escaping or nonce-sensitive paths, and embed or template handlers in code review.
- Sanity Batch 0: no product review is required.
- Sanity Batch 1: no product review is required.
- Sanity Batch 2: verify exact selected-layer hydration, paginated layer search, Discovery map lazy loading and async taxonomy selection.
- Sanity Batch 3: verify the main editors, Discovery and published maps still load after the shared-chunk and bundle-budget changes.
- Sanity Batch 4: verify normal editor use stays console-clean after the cleanup.
- Sanity Batch 5: verify geocoding and public bootstrap flows that were hardened in PHP and JS.
- Sanity Batch 6: no dedicated product review is required beyond confirming the technical gates and documentation are aligned.
- Sanity Batch 7: no product review is required; confirm that each active override still has a documented reason, clear removal criteria, and no upstream replacement that would let us drop it.

## Core functional checklist

1. Build assets
   - Expected result: the build finishes successfully and no new webpack or peer-dependency warnings are introduced.
2. Create and edit a map
   - Expected result: the Maps editor loads, map settings persist and the preview updates without console errors.
3. View published maps with related posts
   - Expected result: popups render, multiple posts at one point can be individually reached and null related points do not crash the map.
4. Edit a storymap with CKEditor
   - Expected result: storymap rich text editing works, images upload and saved content reopens correctly.
5. Reorder layers and storymap slides
   - Expected result: every reorder UI works, with no dropped state, duplicated items or stale order.
6. Edit layer and legend forms
   - Expected result: schema-driven forms, legend controls and interaction settings render, validate and save correctly.
7. Filter Discovery stories by date
   - Expected result: applying and clearing the date range updates the result set as expected.
8. Use geocoding autosuggest
   - Expected result: suggestions load, selecting a result updates the field and no stale request errors appear.
9. Render maps in Mapbox mode
   - Expected result: frontend maps and editor previews render with layers, legends and interactions intact.
10. Render maps in MapLibre mode
   - Expected result: frontend maps and editor previews render with layers, legends and interactions intact.

## Notes by batch type

- Baseline-fix batch: prioritize reproducing the known bug first, then landing a focused fix plus a regression test.
- Replacement batch: preserve existing saved data contracts, validate that the removed package disappears from `npm ci` warnings, and spot-check the replacement wrapper at the exact editor/frontend entry points it now owns.
- Gutenberg or React batch: prioritize editor loading, save flows and peer-warning cleanup before attempting dependent runtime majors.
- Map or rendering batch: prioritize both runtime modes, previews, popups and layer interactions.
- PHP 8.5 batch: distinguish repository-owned deprecations from external `wp-cli` or toolchain noise.
- PHP lint stack batch: evaluate WPCS, PHPCS, PHPCSExtra and PHPCSUtils together instead of treating PHPCS as an isolated major.
- Override governance batch: treat `package.json` overrides as temporary maintenance decisions that must be revisited after major `@wordpress/scripts` or Gutenberg dependency refreshes.
- Plugin sanity track: use `Sanity Batch 0` through `Sanity Batch 7` for the post-upgrade stabilization work, and keep the earlier numbered batches as historical record of the prior dependency-major round.
- Discovery baseline note: story markers and the `View in map` hover focus can still fail independently of the current sanity batches, so track that as a separate future fix instead of treating it as a regression in the incremental-loading batch.
