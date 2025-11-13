#!/usr/bin/env bash
# Dashboard API tests (Bash)

if ! declare -F log_info >/dev/null 2>&1; then
  # shellcheck source=/dev/null
  source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
fi

test_dashboard_overview() {
  log_info "Testing GET /api/v1/dashboard/overview"

  local response
  response="$(http_get "/dashboard/overview")"
  parse_response "$response"

  log_info "Response body: $HTTP_BODY"
  log_info "Response status: $HTTP_STATUS"

  if ! assert_status "200" "$HTTP_STATUS" "Dashboard overview request"; then
    return 1
  fi
  if ! assert_json_field "$HTTP_BODY" "totalMembers" "Dashboard has totalMembers"; then
    return 1
  fi
  if ! assert_json_field "$HTTP_BODY" "activeMembers" "Dashboard has activeMembers"; then
    return 1
  fi
  if ! assert_json_field "$HTTP_BODY" "totalActivities" "Dashboard has totalActivities"; then
    return 1
  fi

  return 0
}

run_dashboard_tests() {
  printf '\n==================================\n'
  printf 'Dashboard Tests\n'
  printf '==================================\n'

  test_dashboard_overview

  printf '\n'
}

