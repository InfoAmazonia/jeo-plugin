#!/bin/bash
#
# Switch PHP version for the JEO dev environment.
# Usage: ./switch-php.sh [8.2|8.3]
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

VERSION="${1:-8.3}"

if [[ "$VERSION" != "8.2" && "$VERSION" != "8.3" ]]; then
    echo "Error: Unsupported PHP version '$VERSION'."
    echo "Usage: $0 [8.2|8.3]"
    exit 1
fi

PHP_VERSION="php${VERSION}"

echo "Switching to PHP ${VERSION}..."

# Update .env
echo "PHP_VERSION=${PHP_VERSION}" > .env

# Pull the image if not already available
if ! docker image inspect "wordpress:${PHP_VERSION}-apache" >/dev/null 2>&1; then
    echo "Pulling image wordpress:${PHP_VERSION}-apache..."
    docker pull "wordpress:${PHP_VERSION}-apache"
fi

# Recreate containers
echo "Recreating containers..."
docker compose down
docker compose up -d

# Verify
sleep 2
ACTUAL=$(docker exec jeo-dev-wordpress php -r "echo PHP_VERSION;" 2>/dev/null || echo "unknown")
echo ""
echo "Done. Container is running PHP ${ACTUAL}."
