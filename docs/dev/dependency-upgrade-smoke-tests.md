# Dependency Upgrade Smoke Tests

Use this checklist when a dependency phase is ready for approval. The workflow for every phase is: update the report, run the automated checks required by the phase, collect the applicable manual review items, and only then ask for approval before creating a commit.

## Approval package

- Summarize the dependencies and lockfiles touched by the phase.
- Update `docs/dev/dependency-upgrade-report.json`, `docs/dev/dependency-upgrade-report.md` and this checklist as needed.
- Record automated check results in the report `executionLog`.
- List only the manual review items that apply to the current phase.

## Preconditions

- Use a WordPress instance that matches the current baseline: WordPress 6.6+, PHP 8.0+ and Node 20 for local builds.
- Test both editor and frontend behavior whenever a phase touches runtime packages.
- Treat a blocked evaluation as a valid outcome for the evaluation-only phases instead of forcing an unsafe upgrade.
- Treat `.github/workflows/node-frontend.yml`, `.github/workflows/php-compat.yml` and `.github/workflows/wordpress-smoke.yml` as the mandatory CI gates from Phase 1 onward.
- If the local WordPress smoke script cannot complete because the machine is missing the expected database or wp-cli runtime setup, record the failure details in the phase report and use the GitHub workflow as the authoritative runtime gate.

## Automated checks by phase

- Phase 0: run `node --check scripts/dependency-review.mjs` and `npm run deps:report`.
- Phase 1: add and validate `.github/workflows/node-frontend.yml`, then confirm the PHP Compatibility and WordPress Smoke Tests workflows remain the mandatory companion gates.
- Phase 2: run `npm run build` and require the Node frontend, PHP Compatibility and WordPress Smoke Tests workflows to stay green.
- Phase 3: add `npm run test:unit`; from this phase onward run it together with `npm run build` and the mandatory workflows.
- Phases 4-7: run `npm run build`, `npm run test:unit`, the Node frontend workflow, the PHP Compatibility workflow and the WordPress Smoke Tests workflow.
- Phase 8: run `composer update --with-all-dependencies`, `vendor/bin/phpcs --standard=phpcs.xml.dist`, `php scripts/check-php-compat.php` and `bash scripts/wordpress-smoke.sh`.

## Manual review by phase

- Phase 0: no manual product review is required.
- Phase 1: confirm the Node frontend, PHP Compatibility and WordPress Smoke Tests workflows trigger on `push` and `pull_request` as intended.
- Phase 2: no dedicated manual review unless asset or wp-admin regressions become visible.
- Phase 3: confirm the new tests cover date selection, sidebar form normalization and Eta template compilation.
- Phase 4: verify related-post start and end date selection, persistence after save/reload and clearing of empty values.
- Phase 5: verify map popups, featured image rendering, date formatting, Info panel content and any locally customized popup template. If the published map still shows the known null-geocode `buildPostsGeoJson` error or still fails to individualize multiple posts that share one point, record both as baseline issues instead of Eta regressions.
- Phase 6: verify add, edit, drag, cancel, save and reopen flows in the geocoding sidebar map.
- Phase 7: verify storymap editor loading, formatting toolbar behavior, selection retention, image upload and save/reopen flows.
- Phase 8: no product review is required; read the Composer and PHPCS compatibility output and record `blocked` if the toolchain is not ready.

## Core functional checklist

1. Build assets
   - Expected result: the build finishes successfully and no new webpack or peer-dependency warnings are introduced.
2. Create and edit a map
   - Expected result: the Maps editor loads, map settings persist and the preview updates without console errors.
3. Edit a storymap with CKEditor
   - Expected result: storymap rich text editing works, images still upload and saved content reopens correctly.
4. Reorder layers and storymap slides
   - Expected result: every reorder UI continues to work, with no dropped state or duplicated items.
5. Edit layer and legend forms
   - Expected result: schema-driven forms, legend controls and interaction settings render, validate and save correctly.
6. Filter Discovery stories by date
   - Expected result: applying and clearing the date range updates the result set as expected.
7. Use geocoding autosuggest
   - Expected result: suggestions load, selecting a result updates the field and no stale request errors appear.
8. Render maps in Mapbox mode
   - Expected result: frontend maps and editor previews render with layers, legends and interactions intact.
9. Render maps in MapLibre mode
   - Expected result: frontend maps and editor previews render with layers, legends and interactions intact.

## Notes by batch type

- Build tooling batch: prioritize asset compilation, CI parity and bundle output.
- Gutenberg batch: prioritize editor loading, save flows and React peer warnings.
- Map/rendering batch: prioritize both runtime modes, previews and layer interactions.
- UI/helper batch: prioritize forms, autosuggest and discovery filters.
