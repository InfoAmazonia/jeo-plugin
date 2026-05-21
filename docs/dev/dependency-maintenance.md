# Dependency Maintenance

JEO uses GitHub-native dependency maintenance for routine updates and keeps
custom repository logic limited to plugin-specific release and runtime checks.

## Automated maintenance

- Dependabot opens weekly pull requests against `develop` for npm, Composer,
  and GitHub Actions updates.
- Dependency Review runs on pull requests and fails when a dependency change
  introduces a high-severity vulnerability or worse.
- `npm audit --package-lock-only` and `composer audit --locked` remain the
  local commands for checking the current lockfiles.

## Reviewing update pull requests

1. Check whether the update is a patch, minor, major, or GitHub Action change.
2. Review the Dependency Review result for newly introduced advisories.
3. Run the relevant local checks:
   - npm or frontend update: `npm ci`, `npm run build`, `npm run build:report`,
     and `npm run test:unit`.
   - PHP or Composer update: `composer install`, `composer audit --locked`,
     `vendor/bin/phpcs --standard=phpcs.xml.dist`, and
     `vendor/bin/phpcs --standard=phpcs-compat.xml.dist`.
   - Runtime-sensitive update: run the WordPress smoke test or wait for the
     WordPress Smoke Tests workflow.
4. For major updates, confirm the editor, map, story map, Discovery, geocoding,
   and public rendering flows touched by the package still behave correctly.

## Overrides

The `overrides` block in `package.json` is reserved for temporary security,
compatibility, or local-package pins. Each override should be removed when the
upstream dependency no longer needs it.

When adding or changing an override, include the reason and the removal
condition in the pull request description. Revisit active overrides after
major `@wordpress/scripts`, Gutenberg, React, or webpack updates.
