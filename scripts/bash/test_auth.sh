#!/usr/bin/env bash
# Authentication API tests (Bash)

if ! declare -F log_info >/dev/null 2>&1; then
  # shellcheck source=/dev/null
  source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
fi

test_auth_login() {
  log_info "Testing POST /api/v1/auth/login"

  local payload
  payload=$(printf '{"identifier":"%s","password":"%s"}' "$ADMIN_USERNAME" "$ADMIN_PASSWORD")
  local response
  response="$(http_post "/auth/login" "$payload")"
  parse_response "$response"

  log_info "Request: POST $API_BASE_URL/auth/login"
  log_info "Payload: $payload"
  log_info "Response body: $HTTP_BODY"
  log_info "Response status: $HTTP_STATUS"

  if ! assert_status "200" "$HTTP_STATUS" "Login request"; then
    return 1
  fi
  if ! assert_json_field "$HTTP_BODY" "accessToken" "Login response has accessToken"; then
    return 1
  fi
  if ! assert_json_field "$HTTP_BODY" "tokenType" "Login response has tokenType"; then
    return 1
  fi

  save_token "$HTTP_BODY"
  return 0
}

test_auth_me() {
  log_info "Testing GET /api/v1/auth/me"

  local response
  response="$(http_get "/auth/me")"
  parse_response "$response"

  log_info "Response body: $HTTP_BODY"
  log_info "Response status: $HTTP_STATUS"

  if ! assert_status "200" "$HTTP_STATUS" "Get profile request"; then
    return 1
  fi
  if ! assert_json_field "$HTTP_BODY" "username" "Profile has username"; then
    return 1
  fi
  if ! assert_json_field "$HTTP_BODY" "role" "Profile has role"; then
    return 1
  fi

  return 0
}

test_auth_invalid_credentials() {
  log_info "Testing login with invalid credentials"

  local payload='{"identifier":"admin","password":"wrongpassword"}'
  local response
  response="$(http_post "/auth/login" "$payload")"
  parse_response "$response"

  log_info "Response status: $HTTP_STATUS"

  assert_status "401" "$HTTP_STATUS" "Invalid credentials should return 401"
}

run_auth_tests() {
  printf '\n==================================\n'
  printf 'Authentication Tests\n'
  printf '==================================\n'

  clear_token

  test_auth_login
  test_auth_me
  test_auth_invalid_credentials

  printf '\n'
}

