#!/usr/bin/env bash
# Downloads and extracts wordpress to the current folder
set -o errexit
set -o nounset
set -o pipefail
#set -o xtrace

wp core install --url=http://${LANDO_APP_NAME}.${LANDO_DOMAIN} $@
