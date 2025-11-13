#!/usr/bin/env bash
# Main entrypoint for Bash-based API regression tests

SCRIPT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=/dev/null
source "$SCRIPT_DIR/lib.sh"

check_dependencies() {
  if ! command -v curl >/dev/null 2>&1; then
    log_error "curl is not installed"
    return 1
  fi
  if ! command -v jq >/dev/null 2>&1; then
    log_error "jq is not installed"
    return 1
  fi
  return 0
}

check_server() {
  log_info "Checking if API server is running at $API_BASE_URL"
  local response
  response="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 "$(_build_url "/auth/login")" || printf '000')"
  if [[ "$response" -ge 200 && "$response" -lt 500 ]]; then
    log_success "Server is running (HTTP $response)"
    return 0
  fi
  log_error "Server is not reachable (HTTP $response)"
  log_info "Please start the server with: cd c3po && ./gradlew bootRun"
  return 1
}

main() {
  printf '==================================\n'
  printf 'C3PO API Test Suite\n'
  printf '==================================\n'
  printf 'Base URL: %s\n' "$API_BASE_URL"
  printf 'Admin User: %s\n\n' "$ADMIN_USERNAME"

  if ! check_dependencies; then
    exit 1
  fi

  clear_token

  log_info "Skipping server health check, starting tests..."

  # shellcheck source=/dev/null
  source "$SCRIPT_DIR/test_auth.sh"
  run_auth_tests

  if [[ -f "$TOKEN_FILE" ]]; then
    # shellcheck source=/dev/null
    source "$SCRIPT_DIR/test_dashboard.sh"
    run_dashboard_tests

    # shellcheck source=/dev/null
    source "$SCRIPT_DIR/test_members.sh"
    run_members_tests

    # shellcheck source=/dev/null
    source "$SCRIPT_DIR/test_activities.sh"
    run_activities_tests

    # shellcheck source=/dev/null
    source "$SCRIPT_DIR/test_admin_users.sh"
    run_admin_users_tests

    # shellcheck source=/dev/null
    source "$SCRIPT_DIR/test_course_content.sh"
    run_course_content_tests
  else
    log_error "Authentication failed, skipping other tests"
  fi

  print_summary

  clear_token

  if ((TESTS_FAILED == 0)); then
    exit 0
  fi
  exit 1
}

main "$@"

