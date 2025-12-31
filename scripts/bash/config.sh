#!/usr/bin/env bash
# API testing shared configuration for Bash scripts

SCRIPT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

: "${API_BASE_URL:="http://localhost:8080/api/v1"}"
: "${API_TIMEOUT:=10}"
: "${ADMIN_USERNAME:="admin"}"
: "${ADMIN_PASSWORD:="admin123"}"

: "${TEST_DATA_DIR:="$SCRIPT_DIR/data"}"
: "${TOKEN_FILE:="/tmp/c3po_test_token"}"

COLOR_RESET=$'\033[0m'
COLOR_RED=$'\033[0;31m'
COLOR_GREEN=$'\033[0;32m'
COLOR_YELLOW=$'\033[0;33m'
COLOR_BLUE=$'\033[0;34m'

TESTS_PASSED=0
TESTS_FAILED=0

export API_BASE_URL API_TIMEOUT ADMIN_USERNAME ADMIN_PASSWORD
export TEST_DATA_DIR TOKEN_FILE

