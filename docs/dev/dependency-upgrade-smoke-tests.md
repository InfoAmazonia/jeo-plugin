# Dependency Upgrade Smoke Tests

Use this checklist for the current stabilization and compatibility track. The major-upgrade phase track remains documented in `docs/dev/dependency-upgrade-report.*`, but approvals now follow the batch sequence below.

## Approval package

- Summarize the dependencies, lockfiles and source files touched by the batch.
- Update `docs/dev/dependency-upgrade-report.json`, `docs/dev/dependency-upgrade-report.md` and this checklist.
- Record automated check results in the report `executionLog`.
- List only the manual review items that apply to the current batch.
- Ask for approval before creating a commit.

## Preconditions

- Use a WordPress instance that matches the current baseline: WordPress 6.6+, PHP 8.0+ and Node 20 for local builds.
- Test both editor and frontend behavior whenever a batch touches runtime code.
- Treat `.github/workflows/node-frontend.yml`, `.github/workflows/php-compat.yml` and `.github/workflows/wordpress-smoke.yml` as the mandatory CI gates.
- When the local WordPress smoke runs from a clean worktree, make sure the ignored `src/js/build` assets have been generated first, or record the resulting asset-include warnings explicitly in the batch report.
- If the local WordPress smoke script cannot complete because the machine is missing the expected database or wp-cli runtime setup, record the failure details in the batch report and use the GitHub workflow as the authoritative runtime gate.
- Treat a blocked evaluation as a valid batch outcome only after recording the blocker, the evidence and the next step in the report.

## Automated checks by batch

- Batch 0: run `composer validate --no-check-publish`, `php scripts/check-php-compat.php`, `WP_CLI_PHP=/opt/homebrew/opt/php@8.4/bin/php WP_DIR=/tmp/jeo-plugin-wordpress-smoke bash scripts/wordpress-smoke.sh`, `node --check scripts/dependency-review.mjs` and `node scripts/dependency-review.mjs --write`.
- Batch 1: run `npm ci`, `npm run build`, `npm run test:unit`, `php scripts/check-php-compat.php` and `WP_CLI_PHP=/opt/homebrew/opt/php@8.4/bin/php WP_DIR=/tmp/jeo-plugin-wordpress-smoke bash scripts/wordpress-smoke.sh`.
- Batch 2: run `npm ci`, `npm run build`, `npm run test:unit`, `php scripts/check-php-compat.php` and `WP_CLI_PHP=/opt/homebrew/opt/php@8.4/bin/php WP_DIR=/tmp/jeo-plugin-wordpress-smoke bash scripts/wordpress-smoke.sh`.
- Batch 3: run `npm ci`, `npm run build`, `npm run test:unit`, `php scripts/check-php-compat.php` and `WP_CLI_PHP=/opt/homebrew/opt/php@8.4/bin/php WP_DIR=/tmp/jeo-plugin-wordpress-smoke bash scripts/wordpress-smoke.sh`.
- Batch 4: run `npm ci`, `npm run build`, `npm run test:unit`, `npm ls react-autosize-textarea react react-dom`, `php scripts/check-php-compat.php` and `WP_CLI_PHP=/opt/homebrew/opt/php@8.4/bin/php WP_DIR=/tmp/jeo-plugin-wordpress-smoke bash scripts/wordpress-smoke.sh`.
- Batch 5: run `npm ci`, `npm run build`, `npm run test:unit`, `php scripts/check-php-compat.php` and `WP_CLI_PHP=/opt/homebrew/opt/php@8.4/bin/php WP_DIR=/tmp/jeo-plugin-wordpress-smoke bash scripts/wordpress-smoke.sh`.
- Batch 6: run `composer validate --no-check-publish`, `php scripts/check-php-compat.php` with PHP `8.0` through `8.5`, the local WordPress smoke on PHP `8.4`, and the local WordPress smoke on PHP `8.5` only after repository-owned deprecations are gone.
- Batch 7: run `composer validate --no-check-publish`, `php scripts/check-php-compat.php`, `vendor/bin/phpcs --standard=phpcs.xml.dist`, and `WP_CLI_PHP=/opt/homebrew/opt/php@8.4/bin/php WP_DIR=/tmp/jeo-plugin-wordpress-smoke bash scripts/wordpress-smoke.sh` if runtime-touching PHP files changed.

## Manual review by batch

- Batch 0: no product review is required.
- Batch 1: verify published-map popups, same-point post individualization, the absence of the null-geocode crash, and storymap slide plus nested layer reorder, including save and reopen after reordering.
- Batch 2: verify geocoding autosuggest, post/map autosuggest usage, Discovery date filtering, and layer or attribution forms backed by schema data.
- Batch 3: verify map-layer ordering, storymap slide ordering and any remaining nested drag or reorder flow that still used `react-beautiful-dnd`.
- Batch 4: verify editor loading, save flows and console cleanliness in the map editor, layer editor, storymap editor and regular post editor after the Gutenberg refresh.
- Batch 5: verify add, edit, drag, cancel, save and reopen flows in the geocoding sidebar map.
- Batch 6: verify the same product smoke already covered by the runtime batches, but execute it while watching specifically for repository-owned PHP 8.5 warnings or deprecations.
- Batch 7: no product review is required unless the PHPCS cleanup changes runtime PHP logic; otherwise review the lint delta and escaping or nonce-sensitive paths in code review.

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
- Replacement batch: preserve existing saved data contracts and validate that the removed package disappears from `npm ci` warnings.
- Gutenberg or React batch: prioritize editor loading, save flows and peer-warning cleanup before attempting dependent runtime majors.
- Map or rendering batch: prioritize both runtime modes, previews, popups and layer interactions.
- PHP 8.5 batch: distinguish repository-owned deprecations from external `wp-cli` or toolchain noise.
- PHP lint stack batch: evaluate WPCS, PHPCS, PHPCSExtra and PHPCSUtils together instead of treating PHPCS as an isolated major.
