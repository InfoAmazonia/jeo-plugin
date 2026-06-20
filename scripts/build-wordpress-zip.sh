#!/usr/bin/env bash
#
# Build a self-contained WordPress-ready ZIP of the JEO plugin.
#
# This script bundles production PHP dependencies (src/vendor/), built JS/CSS
# assets (src/js/build/) and translation files into a single zip that can be
# uploaded to any WordPress installation.
#
# Usage:
#   scripts/build-wordpress-zip.sh              # full build + zip
#   scripts/build-wordpress-zip.sh --skip-assets   # reuse existing src/js/build/
#   scripts/build-wordpress-zip.sh --skip-composer # reuse existing src/vendor/
#   scripts/build-wordpress-zip.sh --skip-i18n     # do not generate translations
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SRC_DIR="${REPO_ROOT}/src"
DIST_DIR="${REPO_ROOT}/dist"
PLUGIN_FILE="${SRC_DIR}/jeo.php"

SKIP_ASSETS=false
SKIP_COMPOSER=false
SKIP_I18N=false

for arg in "${@}"; do
	case "$arg" in
		--skip-assets) SKIP_ASSETS=true ;;
		--skip-composer) SKIP_COMPOSER=true ;;
		--skip-i18n) SKIP_I18N=true ;;
		--help|-h)
			echo "Usage: $(basename "$0") [--skip-assets] [--skip-composer] [--skip-i18n]"
			exit 0
			;;
		*)
			echo "❌ Unknown option: $arg"
			echo "Usage: $(basename "$0") [--skip-assets] [--skip-composer] [--skip-i18n]"
			exit 1
			;;
	esac
done

# ── Helpers ──────────────────────────────────────────────────────────────────
step() {
	echo ""
	echo "========================================"
	echo "  $1"
	echo "========================================"
}

ok() {
	echo "✅ $1"
}

warn() {
	echo "⚠️  $1"
}

fail() {
	echo "❌ $1"
	exit 1
}

require_command() {
	if ! command -v "$1" >/dev/null 2>&1; then
		fail "$1 is required but not found in PATH"
	fi
}

# ── Basic checks ─────────────────────────────────────────────────────────────
step "Checking environment"

require_command composer
require_command npm
require_command zip

ok "Dependencies found"

# ── Extract version ──────────────────────────────────────────────────────────
VERSION=""
if [[ -f "$PLUGIN_FILE" ]]; then
	VERSION=$(sed -n 's/^\s*\*\s*Version:\s*\([0-9.]*\).*/\1/p' "$PLUGIN_FILE" | head -1 || true)
fi
if [[ -z "$VERSION" ]]; then
	VERSION=$(sed -n "s/define(\s*'JEO_VERSION',\s*'\([0-9.]*\)'\s*);/\1/p" "$PLUGIN_FILE" | head -1 || true)
fi
if [[ -z "$VERSION" ]]; then
	fail "Could not extract version from ${PLUGIN_FILE}"
fi
ok "Plugin version: ${VERSION}"

# ── Node version check (with nvm fallback) ──────────────────────────────────
step "Checking Node.js version"

ensure_node_24() {
	local current_version
	current_version=$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)
	if [[ "$current_version" == "24" ]]; then
		return 0
	fi

	if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
		# shellcheck source=/dev/null
		. "$HOME/.nvm/nvm.sh"
	elif [[ -n "${NVM_DIR:-}" && -s "$NVM_DIR/nvm.sh" ]]; then
		# shellcheck source=/dev/null
		. "$NVM_DIR/nvm.sh"
	elif command -v nvm >/dev/null 2>&1; then
		true
	else
		fail "Node.js 24 is required but current version is ${current_version:-unknown}. NVM not found."
	fi

	if nvm use 24 >/dev/null 2>&1; then
		return 0
	fi

	fail "Node.js 24 is required but could not be activated via NVM."
}

ensure_node_24
ok "Node version OK"

# ── Composer dependencies (src/) ─────────────────────────────────────────────
if [[ "$SKIP_COMPOSER" == false ]]; then
	step "Installing production Composer dependencies in src/"
	rm -rf "${SRC_DIR}/vendor"
	composer install --no-interaction --prefer-dist --no-dev --optimize-autoloader \
		--working-dir="${SRC_DIR}" || fail "Composer install failed"
	ok "Composer dependencies installed"
else
	step "Skipping Composer install (--skip-composer)"
	if [[ ! -d "${SRC_DIR}/vendor" ]]; then
		fail "src/vendor/ does not exist. Remove --skip-composer."
	fi
	ok "Using existing src/vendor/"
fi

# ── npm dependencies + assets ────────────────────────────────────────────────
if [[ "$SKIP_ASSETS" == false ]]; then
	step "Installing Node dependencies"
	if [[ ! -d "${REPO_ROOT}/node_modules" ]]; then
		npm ci || fail "npm ci failed"
	else
		npm install || fail "npm install failed"
	fi
	ok "Node dependencies installed"

	step "Building JS/CSS assets"
	npm run build:assets || fail "Asset build failed"
	ok "Assets built"
else
	step "Skipping asset build (--skip-assets)"
	if [[ ! -d "${SRC_DIR}/js/build" ]]; then
		fail "src/js/build/ does not exist. Remove --skip-assets."
	fi
	ok "Using existing src/js/build/"
fi

# ── Translations ─────────────────────────────────────────────────────────────
if [[ "$SKIP_I18N" == false ]]; then
	step "Generating translation files"
	if command -v wp >/dev/null 2>&1; then
		cd "$SRC_DIR"
		wp i18n make-pot . languages/jeowp.pot --slug=jeowp --domain=jeowp --exclude=js/src,js/build || warn "make-pot failed"
		wp i18n make-mo languages || warn "make-mo failed"
		wp i18n make-json languages --no-purge || warn "make-json failed"
		cd "$REPO_ROOT"
		ok "Translations generated"
	else
		warn "WP-CLI not found. Skipping translation generation."
		warn "Install WP-CLI and rerun without --skip-i18n to build .mo/.json files."
	fi
else
	step "Skipping translation generation (--skip-i18n)"
fi

# ── Validate build output ────────────────────────────────────────────────────
step "Validating build output"

if [[ ! -f "${SRC_DIR}/vendor/autoload.php" ]]; then
	fail "src/vendor/autoload.php is missing"
fi

if [[ ! -d "${SRC_DIR}/js/build" ]]; then
	fail "src/js/build/ is missing"
fi

ok "Build output looks good"

# ── Create ZIP in staging directory ──────────────────────────────────────────
step "Creating WordPress-ready ZIP"

mkdir -p "$DIST_DIR"
ZIP_NAME="jeo-${VERSION}.zip"
ZIP_PATH="${DIST_DIR}/${ZIP_NAME}"

STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT

# Remove any previous ZIP so that stale files are not retained by zip -r.
rm -f "$ZIP_PATH"

cp -a "$SRC_DIR" "${STAGE}/jeo"

# Clean up vendor artifacts that are not needed in production uploads.
VENDOR_DIR="${STAGE}/jeo/vendor"
if [[ -d "$VENDOR_DIR" ]]; then
	find "$VENDOR_DIR" -type d \( \
		-name tests -o \
		-name test -o \
		-name docs -o \
		-name doc -o \
		-name examples -o \
		-name .git -o \
		-name .github \
	\) -exec rm -rf {} + 2>/dev/null || true

	find "$VENDOR_DIR" -type f \( \
		-name "*.md" -o \
		-name "phpunit.xml*" -o \
		-name ".gitignore" -o \
		-name ".dockerignore" -o \
		-name ".editorconfig" -o \
		-name "composer.json" -o \
		-name "composer.lock" \
	\) -delete 2>/dev/null || true

	# CLI entry points shipped by libraries are not used at runtime.
	rm -rf "${VENDOR_DIR}/bin" 2>/dev/null || true
fi

# Remove source JS maps and other development artifacts from the bundle.
find "${STAGE}/jeo/js/build" -type f \( \
	-name "*.map" \
\) -delete 2>/dev/null || true

# Build the zip with the plugin root folder named "jeo".
(
	cd "$STAGE"
	zip -r "$ZIP_PATH" jeo \
		-x "*/node_modules/*" \
		-x "*/.git/*" \
		-x "*/.DS_Store" \
		-x "*/README.md" \
		>/dev/null
)

# ── Report ───────────────────────────────────────────────────────────────────
SIZE=$(du -h "$ZIP_PATH" | cut -f1)

echo ""
echo "========================================"
echo "  Build complete!"
echo "  ${ZIP_PATH}"
echo "  Size: ${SIZE}"
echo "========================================"
