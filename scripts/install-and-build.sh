#!/usr/bin/env bash
#
# Full clean reinstall and production build for the JEO Plugin.
#
# Wipes node_modules and vendor (root + src), reinstalls everything from
# lockfiles, then delegates the asset/i18n build and ZIP packaging to build.sh.
#
# Usage:
#   scripts/install-and-build.sh            # reinstall + build + zip
#   scripts/install-and-build.sh --no-zip   # reinstall + build only (no zip)
#

set -euo pipefail

# shellcheck source=lib/common.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"

SKIP_ZIP=false
if [[ "${1:-}" == "--no-zip" ]]; then
	SKIP_ZIP=true
fi

# ── Node 24 (with nvm fallback), validated before any npm step ───────────────
step "Checking Node.js version"
jeo_ensure_node_24
node "${JEO_SCRIPTS_DIR}/check-node-version.mjs" || fail "Node version check failed"
ok "Node version OK"

# ── Fix permissions ──────────────────────────────────────────────────────────
step "Fixing vendor permissions"
if [[ -d "${JEO_SRC_DIR}/vendor" ]]; then
	chmod -R u+w "${JEO_SRC_DIR}/vendor" 2>/dev/null || true
	chown -R "$(whoami):" "${JEO_SRC_DIR}/vendor" 2>/dev/null || true
fi
ok "Permissions checked"

# ── Composer (root, dev tooling) ─────────────────────────────────────────────
step "Reinstalling Composer dependencies (root)"
rm -rf "${JEO_REPO_ROOT}/vendor"
composer install --no-interaction --prefer-dist --optimize-autoloader \
	--working-dir="${JEO_REPO_ROOT}" || fail "Composer root install failed"
ok "Composer root done"

# ── Composer (src/, production) ──────────────────────────────────────────────
step "Reinstalling Composer dependencies (src/)"
rm -rf "${JEO_SRC_DIR}/vendor"
composer install --no-interaction --prefer-dist --no-dev --optimize-autoloader \
	--working-dir="${JEO_SRC_DIR}" || fail "Composer src install failed"
ok "Composer src done"

# ── npm ──────────────────────────────────────────────────────────────────────
step "Reinstalling Node dependencies"
rm -rf "${JEO_REPO_ROOT}/node_modules"
npm ci || fail "npm ci failed"
ok "npm install done"

# ── Build (+ optional ZIP) ───────────────────────────────────────────────────
# Composer and Node are already in place, so delegate to build.sh with
# --skip-composer to avoid reinstalling production deps a second time.
if [[ "$SKIP_ZIP" == true ]]; then
	step "Running production build (no zip)"
	npm run build || fail "npm run build failed"
	ok "Build complete"
else
	step "Running production build + ZIP"
	bash "${JEO_SCRIPTS_DIR}/build.sh" --skip-composer || fail "build.sh failed"
fi

# ── PHP lint (sanity check after a clean reinstall) ──────────────────────────
step "Running PHP lint"
php -l "${JEO_SRC_DIR}/includes/ai/class-rag-agent.php" >/dev/null
php -l "${JEO_SRC_DIR}/includes/ai/class-rag-worker.php" >/dev/null
php -l "${JEO_SRC_DIR}/includes/ai/class-layer-data-loader.php" >/dev/null
php -l "${JEO_SRC_DIR}/includes/settings/class-settings.php" >/dev/null
php -l "${JEO_SRC_DIR}/includes/minimap/class-minimap.php" >/dev/null
ok "PHP lint passed"

echo ""
echo "========================================"
echo "  Install + Build complete!"
echo "========================================"
