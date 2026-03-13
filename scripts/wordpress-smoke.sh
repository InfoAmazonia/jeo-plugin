#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

WP_CLI="${WP_CLI:-wp}"
WP_DIR="${WP_DIR:-${REPO_ROOT}/.tmp/wordpress}"
WP_VERSION="${WP_VERSION:-latest}"
WP_LOCALE="${WP_LOCALE:-en_US}"
WP_SITE_URL="${WP_SITE_URL:-http://127.0.0.1}"
WP_TITLE="${WP_TITLE:-JEO Smoke Test}"
WP_ADMIN_USER="${WP_ADMIN_USER:-admin}"
WP_ADMIN_PASSWORD="${WP_ADMIN_PASSWORD:-admin}"
WP_ADMIN_EMAIL="${WP_ADMIN_EMAIL:-admin@example.com}"
WP_DB_NAME="${WP_DB_NAME:-wordpress}"
WP_DB_USER="${WP_DB_USER:-wordpress}"
WP_DB_PASSWORD="${WP_DB_PASSWORD:-wordpress}"
WP_DB_HOST="${WP_DB_HOST:-127.0.0.1:3306}"
PLUGIN_SLUG="${PLUGIN_SLUG:-jeo}"
PLUGIN_SOURCE="${PLUGIN_SOURCE:-${REPO_ROOT}/src}"

mkdir -p "${WP_DIR}"

"${WP_CLI}" core download \
	--path="${WP_DIR}" \
	--version="${WP_VERSION}" \
	--locale="${WP_LOCALE}" \
	--force \
	--skip-content

mkdir -p "${WP_DIR}/wp-content/plugins"
ln -sfn "${PLUGIN_SOURCE}" "${WP_DIR}/wp-content/plugins/${PLUGIN_SLUG}"

"${WP_CLI}" config create \
	--path="${WP_DIR}" \
	--dbname="${WP_DB_NAME}" \
	--dbuser="${WP_DB_USER}" \
	--dbpass="${WP_DB_PASSWORD}" \
	--dbhost="${WP_DB_HOST}" \
	--dbprefix=wp_ \
	--skip-check \
	--force

if ! "${WP_CLI}" db check --path="${WP_DIR}" >/dev/null 2>&1; then
	"${WP_CLI}" db create --path="${WP_DIR}"
fi

if ! "${WP_CLI}" core is-installed --path="${WP_DIR}" >/dev/null 2>&1; then
	"${WP_CLI}" core install \
		--path="${WP_DIR}" \
		--url="${WP_SITE_URL}" \
		--title="${WP_TITLE}" \
		--admin_user="${WP_ADMIN_USER}" \
		--admin_password="${WP_ADMIN_PASSWORD}" \
		--admin_email="${WP_ADMIN_EMAIL}" \
		--skip-email
fi

"${WP_CLI}" plugin activate "${PLUGIN_SLUG}" --path="${WP_DIR}"
"${WP_CLI}" plugin list --path="${WP_DIR}"
"${WP_CLI}" post-type list --field=name --path="${WP_DIR}"
"${WP_CLI}" eval-file "${SCRIPT_DIR}/wordpress-smoke-check.php" --path="${WP_DIR}"
