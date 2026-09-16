#!/usr/bin/env bash
# JEO WP-CLI helper
# Runs WP-CLI inside the Docker container against the local dev WordPress.
# Usage: bash .docker/wp.sh <wp-cli-command>
# Example: bash .docker/wp.sh plugin list
# Example: bash .docker/wp.sh user update admin --user_pass=newpass

cd "$(dirname "$0")"

docker compose --profile cli run --rm jeo-dev-wpcli "$@"
