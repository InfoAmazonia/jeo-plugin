#!/usr/bin/env bash
# Sets up the test environment
set -o errexit
set -o nounset
set -o pipefail
#set -o xtrace

sed "s_/tmp/wordpress/_$(pwd)/test-environment/_" tests/bootstrap-config-sample.php > tests/bootstrap-config.php
