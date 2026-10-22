#!/usr/bin/env bash
#
# Shared helpers for the JEO build/release scripts.
#
# This file is meant to be *sourced*, not executed:
#
#   source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"
#
# It centralizes everything that used to be duplicated across build.sh,
# install-and-build.sh and build-wordpress-zip.sh: logging helpers, the
# Node 24 check (with nvm fallback), plugin-version extraction and the
# WordPress-ready ZIP packaging routine.

# Resolve repo paths from this file's location (scripts/lib/common.sh).
JEO_SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JEO_REPO_ROOT="$(cd "${JEO_SCRIPTS_DIR}/.." && pwd)"
JEO_SRC_DIR="${JEO_REPO_ROOT}/src"
JEO_DIST_DIR="${JEO_REPO_ROOT}/dist"
JEO_PLUGIN_FILE="${JEO_SRC_DIR}/jeo.php"

# ── Logging helpers ──────────────────────────────────────────────────────────
step() {
	echo ""
	echo "========================================"
	echo "  $1"
	echo "========================================"
}

ok()   { echo "✅ $1"; }
warn() { echo "⚠️  $1"; }
fail() { echo "❌ $1" >&2; exit 1; }

require_command() {
	command -v "$1" >/dev/null 2>&1 || fail "$1 is required but not found in PATH"
}

# ── Plugin version ───────────────────────────────────────────────────────────
# Echoes the plugin version, read from the jeo.php header or the JEO_VERSION
# constant. Returns non-zero if it cannot be determined.
jeo_plugin_version() {
	local version=""
	if [[ -f "$JEO_PLUGIN_FILE" ]]; then
		version=$(sed -n 's/^\s*\*\s*Version:\s*\([0-9.]*\).*/\1/p' "$JEO_PLUGIN_FILE" | head -1 || true)
		if [[ -z "$version" ]]; then
			version=$(sed -n "s/define(\s*'JEO_VERSION',\s*'\([0-9.]*\)'\s*);/\1/p" "$JEO_PLUGIN_FILE" | head -1 || true)
		fi
	fi
	[[ -n "$version" ]] || return 1
	echo "$version"
}

# ── Node 24 check (with nvm fallback) ────────────────────────────────────────
# Ensures the active Node.js runtime is the major version 24 required by
# package.json `devEngines`. If it is not, it loads nvm (sourcing it first so
# `nvm use` works in non-interactive shells) and switches to / installs Node 24.
# Validates *before* any npm step runs, so callers never hit EBADDEVENGINES.
jeo_ensure_node_24() {
	# Load nvm into the current shell up-front, if it is not already a function.
	if ! command -v nvm >/dev/null 2>&1; then
		if [[ -n "${NVM_DIR:-}" && -s "${NVM_DIR}/nvm.sh" ]]; then
			# shellcheck source=/dev/null
			\. "${NVM_DIR}/nvm.sh" >/dev/null 2>&1 || true
		elif [[ -s "${HOME}/.nvm/nvm.sh" ]]; then
			# shellcheck source=/dev/null
			\. "${HOME}/.nvm/nvm.sh" >/dev/null 2>&1 || true
		fi
	fi

	local current
	current="$(node -v 2>/dev/null | sed 's/^v//' | cut -d. -f1)"

	if [[ "$current" == "24" ]]; then
		ok "Node $(node -v) detected"
		return 0
	fi

	# Not on Node 24 — the nvm fallback is the only way forward.
	if ! command -v nvm >/dev/null 2>&1; then
		fail "Node.js 24 is required (active: ${current:-none}) and nvm was not found. Run 'nvm use 24' or install Node 24, then retry."
	fi

	warn "Active Node is ${current:-none}; switching to Node 24 via nvm..."
	if ! nvm use 24 >/dev/null 2>&1; then
		echo "    Node 24 not installed; installing via nvm..."
		nvm install 24 >/dev/null 2>&1 || fail "Failed to install Node 24 via nvm."
		nvm use 24 >/dev/null 2>&1 || fail "Failed to activate Node 24 via nvm."
	fi

	current="$(node -v 2>/dev/null | sed 's/^v//' | cut -d. -f1)"
	[[ "$current" == "24" ]] || fail "Node 24 is required but the active version is $(node -v 2>/dev/null || echo none)."
	ok "Node $(node -v) active (via nvm)"
}

# ── Required PHP extensions ──────────────────────────────────────────────────
# Verifies the PHP CLI has the extensions the production Composer dependencies
# need (phpoffice/phpword pulls ext-dom/ext-xml/ext-zip). Fails early with an
# actionable apt hint instead of letting `composer install` error cryptically.
jeo_ensure_php_extensions() {
	require_command php

	local php_minor missing=() ext
	php_minor="$(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;' 2>/dev/null)"

	for ext in dom xml zip mbstring; do
		if ! php -m 2>/dev/null | grep -qix "$ext"; then
			missing+=( "$ext" )
		fi
	done

	if [[ ${#missing[@]} -gt 0 ]]; then
		local pkgs=""
		for ext in "${missing[@]}"; do
			case "$ext" in
				dom|xml) pkgs="${pkgs} php${php_minor:-8.x}-xml" ;;
				zip)     pkgs="${pkgs} php${php_minor:-8.x}-zip" ;;
				mbstring) pkgs="${pkgs} php${php_minor:-8.x}-mbstring" ;;
			esac
		done
		# De-duplicate package list.
		pkgs="$(echo "$pkgs" | tr ' ' '\n' | sort -u | tr '\n' ' ' | sed 's/^ *//;s/ *$//')"
		fail "Missing PHP extension(s): ${missing[*]}. Install with: sudo apt-get install ${pkgs} && sudo phpenmod ${missing[*]}"
	fi

	ok "PHP extensions OK (dom, xml, zip, mbstring)"
}

# ── WordPress-ready ZIP packaging ────────────────────────────────────────────
# Packages src/ into dist/jeo-{version}.zip with the plugin root folder named
# "jeo", stripping development artifacts from vendor/ and js/build/. Exports the
# resulting path in JEO_ZIP_PATH.
jeo_create_zip() {
	require_command zip

	local version zip_name zip_path stage vendor_dir
	version="$(jeo_plugin_version)" || fail "Could not determine plugin version from ${JEO_PLUGIN_FILE}"
	zip_name="jeo-${version}.zip"
	zip_path="${JEO_DIST_DIR}/${zip_name}"

	mkdir -p "$JEO_DIST_DIR"
	# Remove any previous ZIP so stale files are not retained by `zip -r`.
	rm -f "$zip_path"

	stage="$(mktemp -d)"
	# shellcheck disable=SC2064
	trap "rm -rf '${stage}'" RETURN

	cp -a "$JEO_SRC_DIR" "${stage}/jeo"

	# Clean up vendor artifacts that are not needed in production uploads.
	vendor_dir="${stage}/jeo/vendor"
	if [[ -d "$vendor_dir" ]]; then
		find "$vendor_dir" -type d \( \
			-name tests -o -name test -o -name docs -o -name doc -o \
			-name examples -o -name .git -o -name .github \
		\) -exec rm -rf {} + 2>/dev/null || true

		find "$vendor_dir" -type f \( \
			-name "*.md" -o -name "phpunit.xml*" -o -name ".gitignore" -o \
			-name ".dockerignore" -o -name ".editorconfig" -o \
			-name "composer.json" -o -name "composer.lock" \
		\) -delete 2>/dev/null || true

		# CLI entry points shipped by libraries are not used at runtime.
		rm -rf "${vendor_dir}/bin" 2>/dev/null || true
	fi

	# Remove source maps and other development artifacts from the bundle.
	if [[ -d "${stage}/jeo/js/build" ]]; then
		find "${stage}/jeo/js/build" -type f -name "*.map" -delete 2>/dev/null || true
	fi

	(
		cd "$stage"
		zip -r "$zip_path" jeo \
			-x "*/node_modules/*" \
			-x "*/.git/*" \
			-x "*/.DS_Store" \
			-x "*/README.md" \
			>/dev/null
	)

	JEO_ZIP_PATH="$zip_path"
	ok "ZIP created: ${zip_path} ($(du -h "$zip_path" | cut -f1))"
}
