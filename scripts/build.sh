#!/usr/bin/env bash
#
# Build a WordPress-ready release ZIP of the JEO plugin (dist/jeo-{version}.zip).
#
# This is the single canonical release builder. It validates the Node runtime
# (switching to Node 24 via nvm when needed), checks release metadata, installs
# production PHP dependencies, builds JS/CSS assets and translations, then
# packages a self-contained ZIP ready for upload to any WordPress install.
#
# Usage:
#   scripts/build.sh                 # node check + meta + composer + assets + i18n + zip
#   scripts/build.sh --skip-assets   # reuse existing src/js/build/
#   scripts/build.sh --skip-composer # reuse existing src/vendor/
#   scripts/build.sh --skip-i18n     # do not (re)generate translations
#   scripts/build.sh --skip-build    # skip all build steps, just (re)zip
#

set -euo pipefail

# shellcheck source=lib/common.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"

usage() {
	echo "Usage: $(basename "$0") [--skip-assets] [--skip-composer] [--skip-i18n] [--skip-build]"
}

SKIP_ASSETS=false
SKIP_COMPOSER=false
SKIP_I18N=false

for arg in "$@"; do
	case "$arg" in
		--skip-assets)   SKIP_ASSETS=true ;;
		--skip-composer) SKIP_COMPOSER=true ;;
		--skip-i18n)     SKIP_I18N=true ;;
		--skip-build)    SKIP_ASSETS=true; SKIP_COMPOSER=true; SKIP_I18N=true ;;
		-h|--help)       usage; exit 0 ;;
		*)               echo "❌ Unknown option: $arg"; usage; exit 1 ;;
	esac
done

step "JEO Plugin Release Builder"
require_command composer
require_command zip

VERSION="$(jeo_plugin_version)" || fail "Could not extract version from ${JEO_PLUGIN_FILE}"
ok "Plugin version: ${VERSION}"

# ── Node 24 ──────────────────────────────────────────────────────────────────
step "Checking Node.js version"
jeo_ensure_node_24

# ── Release metadata ─────────────────────────────────────────────────────────
step "Validating release metadata"
node "${JEO_SCRIPTS_DIR}/validate-release-meta.mjs" || fail "Release metadata validation failed"
ok "Metadata valid"

# ── Composer (production) ────────────────────────────────────────────────────
if [[ "$SKIP_COMPOSER" == false ]]; then
	step "Installing production Composer dependencies (src/)"
	rm -rf "${JEO_SRC_DIR}/vendor"
	composer install --no-interaction --prefer-dist --no-dev --optimize-autoloader \
		--working-dir="${JEO_SRC_DIR}" || fail "Composer install failed"
	ok "Composer dependencies installed"
else
	step "Skipping Composer install (--skip-composer)"
	[[ -f "${JEO_SRC_DIR}/vendor/autoload.php" ]] || fail "src/vendor/ is missing. Remove --skip-composer."
	ok "Using existing src/vendor/"
fi

# ── Assets ───────────────────────────────────────────────────────────────────
if [[ "$SKIP_ASSETS" == false ]]; then
	step "Building JS/CSS assets"
	npm run build:assets || fail "Asset build failed"
	ok "Assets built"
else
	step "Skipping asset build (--skip-assets)"
	[[ -d "${JEO_SRC_DIR}/js/build" ]] || fail "src/js/build/ is missing. Remove --skip-assets."
	ok "Using existing src/js/build/"
fi

# ── Translations ─────────────────────────────────────────────────────────────
if [[ "$SKIP_I18N" == false ]]; then
	step "Compiling translation files"
	if command -v wp >/dev/null 2>&1; then
		npm run i18n:compile || warn "i18n compile failed"
		ok "Translations compiled"
	else
		warn "WP-CLI not found. Skipping translation compilation."
		warn "Install WP-CLI and rerun without --skip-i18n to build .mo/.json files."
	fi
else
	step "Skipping translation compilation (--skip-i18n)"
fi

# ── Validate build output ────────────────────────────────────────────────────
step "Validating build output"
[[ -f "${JEO_SRC_DIR}/vendor/autoload.php" ]] || fail "src/vendor/autoload.php is missing"
[[ -d "${JEO_SRC_DIR}/js/build" ]] || fail "src/js/build/ is missing"
ok "Build output looks good"

# ── ZIP ──────────────────────────────────────────────────────────────────────
step "Creating WordPress-ready ZIP"
jeo_create_zip

step "Build complete!"
echo "  ${JEO_ZIP_PATH}"
