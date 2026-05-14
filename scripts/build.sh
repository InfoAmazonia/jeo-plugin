#!/usr/bin/env bash
#
# Build a WordPress-ready ZIP from src/ for upload to wordpress.org.
#
# Usage:
#   scripts/build.sh              # builds dist/jeo-{version}.zip
#   scripts/build.sh --skip-build # skips npm/composer, just re-zips
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DIST_DIR="${REPO_ROOT}/dist"

PLUGIN_FILE="${REPO_ROOT}/src/jeo.php"
README_FILE="${REPO_ROOT}/src/readme.txt"

echo "========================================"
echo "  JEO Plugin Release Builder"
echo "========================================"
echo

# ── Extract version ──────────────────────────────────────────────────────────
VERSION=""
if [[ -f "$PLUGIN_FILE" ]]; then
	VERSION=$(sed -n 's/^\s*\*\s*Version:\s*\([0-9.]*\).*/\1/p' "$PLUGIN_FILE" | head -1 || true)
fi
if [[ -z "$VERSION" ]]; then
	VERSION=$(sed -n "s/define(\s*'JEO_VERSION',\s*'\([0-9.]*\)'\s*);/\1/p" "$PLUGIN_FILE" | head -1 || true)
fi
if [[ -z "$VERSION" ]]; then
	echo "❌ Could not extract version from ${PLUGIN_FILE}"
	exit 1
fi
echo "📦 Version: ${VERSION}"
echo

# ── Validate release metadata ────────────────────────────────────────────────
echo "🔍 Validating release metadata..."
node "${SCRIPT_DIR}/validate-release-meta.mjs"
echo "✅ Metadata valid"
echo

# ── Run builds (unless skipped) ──────────────────────────────────────────────
SKIP_BUILD=false
if [[ "${1:-}" == "--skip-build" ]]; then
	SKIP_BUILD=true
fi

if [[ "$SKIP_BUILD" == false ]]; then
	echo "📦 Installing PHP dependencies (no-dev)..."
	composer install --no-dev --optimize-autoloader --quiet
	echo "✅ Composer done"
	echo

	echo "📦 Building JS/CSS assets..."
	npm run build
	echo "✅ npm build done"
	echo
else
	echo "⏭️  Skipping npm/composer builds (--skip-build)"
	echo
fi

# ── Copy vendor into src/ ────────────────────────────────────────────────────
echo "📂 Copying vendor/ into src/vendor/..."
rm -rf "${REPO_ROOT}/src/vendor"
cp -a "${REPO_ROOT}/vendor" "${REPO_ROOT}/src/vendor"
echo "✅ Vendor copied"
echo

# ── Create ZIP ───────────────────────────────────────────────────────────────
mkdir -p "$DIST_DIR"
ZIP_NAME="jeo-${VERSION}.zip"
ZIP_PATH="${DIST_DIR}/${ZIP_NAME}"

echo "🗜️  Creating ${ZIP_NAME}..."
(
	cd "$REPO_ROOT"
	# Create a temp staging dir so the ZIP root folder is named "jeo/"
	STAGE=$(mktemp -d)
	cp -a src "${STAGE}/jeo"
	(
		cd "$STAGE"
		zip -r "$ZIP_PATH" jeo -x "*/node_modules/*" -x "*/.git/*" -x "*/.DS_Store" >/dev/null
	)
	rm -rf "$STAGE"
)

echo "✅ ZIP created: ${ZIP_PATH}"
echo

# ── Report size ──────────────────────────────────────────────────────────────
SIZE=$(du -h "$ZIP_PATH" | cut -f1)
echo "📊 Size: ${SIZE}"
echo

# ── Clean up src/vendor ──────────────────────────────────────────────────────
echo "🧹 Cleaning src/vendor..."
rm -rf "${REPO_ROOT}/src/vendor"
echo "✅ Done"
echo

echo "========================================"
echo "  Build complete!"
echo "  ${ZIP_PATH}"
echo "========================================"
