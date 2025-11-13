#!/usr/bin/env bash
# Members API tests (Bash)

if ! declare -F log_info >/dev/null 2>&1; then
  # shellcheck source=/dev/null
  source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
fi

CREATED_MEMBER_ID=""

test_members_create() {
  log_info "Testing POST /api/v1/members"

  local timestamp
  timestamp="$(date +%s)"
  local payload
  payload=$(printf '{"name":"Test Member %s","studentId":"S%s","major":"Computer Science","joinDate":"2024-01-01","status":"active","role":"member","email":"test%s@example.com","phone":"1234567890"}' "$timestamp" "$timestamp" "$timestamp")

  local response
  response="$(http_post "/members" "$payload")"
  parse_response "$response"

  log_info "Response body: $HTTP_BODY"
  log_info "Response status: $HTTP_STATUS"

  if ! assert_status "200" "$HTTP_STATUS" "Create member request"; then
    return 1
  fi
  if ! assert_json_field "$HTTP_BODY" "id" "Member response has id"; then
    return 1
  fi

  CREATED_MEMBER_ID="$(echo "$HTTP_BODY" | jq -r '.id')"
  log_info "Created member ID: $CREATED_MEMBER_ID"
  return 0
}

test_members_list() {
  log_info "Testing GET /api/v1/members"

  local response
  response="$(http_get "/members?page=1&limit=20")"
  parse_response "$response"

  log_info "Response status: $HTTP_STATUS"

  if ! assert_status "200" "$HTTP_STATUS" "List members request"; then
    return 1
  fi
  if ! assert_json_field "$HTTP_BODY" "items" "Members response has items"; then
    return 1
  fi

  return 0
}

test_members_get() {
  if [[ -z "$CREATED_MEMBER_ID" ]]; then
    log_warn "Skipping GET member test (no member created)"
    return 0
  fi

  log_info "Testing GET /api/v1/members/$CREATED_MEMBER_ID"

  local response
  response="$(http_get "/members/$CREATED_MEMBER_ID")"
  parse_response "$response"

  log_info "Response status: $HTTP_STATUS"

  if ! assert_status "200" "$HTTP_STATUS" "Get member request"; then
    return 1
  fi
  if ! assert_json_field "$HTTP_BODY" "id" "Member has id"; then
    return 1
  fi

  return 0
}

test_members_delete() {
  if [[ -z "$CREATED_MEMBER_ID" ]]; then
    log_warn "Skipping DELETE member test (no member created)"
    return 0
  fi

  log_info "Testing DELETE /api/v1/members/$CREATED_MEMBER_ID"

  local response
  response="$(http_delete "/members/$CREATED_MEMBER_ID")"
  parse_response "$response"

  log_info "Response status: $HTTP_STATUS"

  if [[ "$HTTP_STATUS" == "204" || "$HTTP_STATUS" == "200" ]]; then
    log_success "Delete member request (HTTP $HTTP_STATUS)"
    return 0
  fi

  log_error "Delete member request (Expected HTTP 204 or 200, got $HTTP_STATUS)"
  return 1
}

run_members_tests() {
  printf '\n==================================\n'
  printf 'Members Tests\n'
  printf '==================================\n'

  test_members_create
  test_members_list
  test_members_get
  test_members_delete

  printf '\n'
}

