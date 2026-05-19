#!/usr/bin/env bash
#
# Full reinstall and production build for JEO Plugin.
#
# Usage:
#   scripts/install-and-build.sh              # reinstall + build + zip
#   scripts/install-and-build.sh --no-zip     # reinstall + build only
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

SKIP_ZIP=false
if [[ "${1:-}" == "--no-zip" ]]; then
	SKIP_ZIP=true
fi

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

fail() {
	echo "❌ $1"
	exit 1
}

# ── Node version check (with nvm fallback) ──────────────────────────────────
step "Checking Node.js version"

ensure_node_24() {
	local current_version
	current_version=$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)
	if [[ "$current_version" == "24" ]]; then
		return 0
	fi

	# Not Node 24 — try nvm
	if [[ -n "${NVM_DIR:-}" && -s "$NVM_DIR/nvm.sh" ]]; then
		# shellcheck source=/dev/null
		. "$NVM_DIR/nvm.sh"
	elif [[ -s "$HOME/.nvm/nvm.sh" ]]; then
		# shellcheck source=/dev/null
		. "$HOME/.nvm/nvm.sh"
	elif command -v nvm >/dev/null 2>&1; then
		true  # nvm is a shell function; command -v checks if it's available
	else
		fail "Node.js 24 is required but current version is ${current_version:-unknown}. NVM not found."
	fi

	# Try to use Node 24 via nvm
	if nvm use 24 >/dev/null 2>&1; then
		return 0
	fi

	# Try to install Node 24 via nvm
	echo "Node 24 not installed via NVM. Attempting to install..."
	if nvm install 24 >/dev/null 2>&1 && nvm use 24 >/dev/null 2>&1; then
		return 0
	fi

	fail "Node.js 24 is required but could not be activated via NVM."
}

ensure_node_24
node "${SCRIPT_DIR}/check-node-version.mjs" || fail "Node version check failed"
ok "Node version OK"

# ── Fix permissions ──────────────────────────────────────────────────────────
step "Fixing vendor permissions"
if [[ -d "${REPO_ROOT}/src/vendor" ]]; then
	chmod -R u+w "${REPO_ROOT}/src/vendor" 2>/dev/null || true
	chown -R "$(whoami):" "${REPO_ROOT}/src/vendor" 2>/dev/null || true
fi
ok "Permissions checked"

# ── Composer (root) ──────────────────────────────────────────────────────────
step "Reinstalling Composer dependencies (root)"
rm -rf "${REPO_ROOT}/vendor"
composer install --no-interaction --prefer-dist --optimize-autoloader \
	--working-dir="${REPO_ROOT}" || fail "Composer root install failed"
ok "Composer root done"

# ── Composer (src/) ──────────────────────────────────────────────────────────
step "Reinstalling Composer dependencies (src/)"
rm -rf "${REPO_ROOT}/src/vendor"
composer install --no-interaction --prefer-dist --no-dev --optimize-autoloader \
	--working-dir="${REPO_ROOT}/src" || fail "Composer src install failed"
ok "Composer src done"

# ── npm ──────────────────────────────────────────────────────────────────────
step "Reinstalling Node dependencies"
rm -rf "${REPO_ROOT}/node_modules"
npm ci || fail "npm ci failed"
ok "npm install done"

# ── Build ────────────────────────────────────────────────────────────────────
step "Running production build"
npm run build || fail "npm run build failed"
ok "Build complete"

# ── PHP lint ─────────────────────────────────────────────────────────────────
step "Running PHP lint"
php -l "${REPO_ROOT}/src/includes/ai/class-rag-agent.php" >/dev/null
php -l "${REPO_ROOT}/src/includes/ai/class-rag-worker.php" >/dev/null
php -l "${REPO_ROOT}/src/includes/ai/class-layer-data-loader.php" >/dev/null
php -l "${REPO_ROOT}/src/includes/settings/class-settings.php" >/dev/null
php -l "${REPO_ROOT}/src/includes/minimap/class-minimap.php" >/dev/null
ok "PHP lint passed"

# ── ZIP ──────────────────────────────────────────────────────────────────────
if [[ "$SKIP_ZIP" == false ]]; then
	step "Creating release ZIP"
	bash "${SCRIPT_DIR}/build.sh" --skip-build || fail "ZIP build failed"
	ok "ZIP created"
fi

# ── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo "========================================"
echo "  Install + Build complete!"
echo "========================================"
