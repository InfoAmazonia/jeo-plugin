#!/usr/bin/env bash
# Downloads and extracts wordpress to the current folder
set -o errexit
set -o nounset
set -o pipefail
#set -o xtrace

wget https://wordpress.org/latest.tar.gz --output-document=- | tar --extract --ungzip
