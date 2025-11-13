#!/usr/bin/env bash
# Activities API tests (Bash)

if ! declare -F log_info >/dev/null 2>&1; then
  # shellcheck source=/dev/null
  source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
fi

CREATED_ACTIVITY_ID=""

test_activities_create() {
  log_info "Testing POST /api/v1/activities"

  local timestamp
  timestamp="$(date +%s)"
  local payload
  payload=$(printf '{"name":"Test Activity %s","description":"Test activity description","activityDate":"2024-12-31","location":"Test Location","capacity":50,"status":"upcoming"}' "$timestamp")

  local response
  response="$(http_post "/activities" "$payload")"
  parse_response "$response"

  log_info "Response body: $HTTP_BODY"
  log_info "Response status: $HTTP_STATUS"

  if ! assert_status "200" "$HTTP_STATUS" "Create activity request"; then
    return 1
  fi
  if ! assert_json_field "$HTTP_BODY" "id" "Activity response has id"; then
    return 1
  fi

  CREATED_ACTIVITY_ID="$(echo "$HTTP_BODY" | jq -r '.id')"
  log_info "Created activity ID: $CREATED_ACTIVITY_ID"
  return 0
}

test_activities_list() {
  log_info "Testing GET /api/v1/activities"

  local response
  response="$(http_get "/activities?page=1&limit=20")"
  parse_response "$response"

  log_info "Response status: $HTTP_STATUS"

  if ! assert_status "200" "$HTTP_STATUS" "List activities request"; then
    return 1
  fi
  if ! assert_json_field "$HTTP_BODY" "items" "Activities response has items"; then
    return 1
  fi

  return 0
}

test_activities_get() {
  if [[ -z "$CREATED_ACTIVITY_ID" ]]; then
    log_warn "Skipping GET activity test (no activity created)"
    return 0
  fi

  log_info "Testing GET /api/v1/activities/$CREATED_ACTIVITY_ID"

  local response
  response="$(http_get "/activities/$CREATED_ACTIVITY_ID")"
  parse_response "$response"

  log_info "Response status: $HTTP_STATUS"

  if ! assert_status "200" "$HTTP_STATUS" "Get activity request"; then
    return 1
  fi
  if ! assert_json_field "$HTTP_BODY" "id" "Activity has id"; then
    return 1
  fi

  return 0
}

run_activities_tests() {
  printf '\n==================================\n'
  printf 'Activities Tests\n'
  printf '==================================\n'

  test_activities_create
  test_activities_list
  test_activities_get

  printf '\n'
}

