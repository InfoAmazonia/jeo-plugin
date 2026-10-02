#!/usr/bin/env bash
#
# Deprecated alias for scripts/build.sh.
#
# All build/packaging logic now lives in scripts/build.sh + scripts/lib/common.sh.
# This wrapper is kept so existing docs, muscle memory and the same flags
# (--skip-assets / --skip-composer / --skip-i18n) keep working.
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "ℹ️  build-wordpress-zip.sh is now an alias for build.sh — delegating..."
exec "${SCRIPT_DIR}/build.sh" "$@"
