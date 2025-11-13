#!/usr/bin/env bash
# Admin user management API tests (Bash)

if ! declare -F log_info >/dev/null 2>&1; then
  # shellcheck source=/dev/null
  source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
fi

ADMIN_USERS_LAST_ID=""
ADMIN_USERS_LAST_USERNAME=""
ADMIN_USERS_LAST_PASSWORD=""

admin_users_login_as() {
  local username="$1"
  local password="$2"
  local payload
  payload=$(printf '{"identifier":"%s","password":"%s"}' "$username" "$password")

  local response
  response="$(http_post "/auth/login" "$payload")"
  parse_response "$response"

  if ! assert_status "200" "$HTTP_STATUS" "Login as $username"; then
    return 1
  fi
  if ! assert_json_field "$HTTP_BODY" "accessToken" "Login response has accessToken"; then
    return 1
  fi

  save_token "$HTTP_BODY" >/dev/null
  return 0
}

admin_users_assert_json_equals() {
  local json="$1"
  local field="$2"
  local expected="$3"
  local message="$4"
  local actual
  actual="$(echo "$json" | jq -r ".${field} // empty")"
  if [[ "$actual" == "$expected" ]]; then
    log_success "$message ('$actual')"
    return 0
  fi
  log_error "$message (expected '$expected', got '${actual:-<empty>}')"
  return 1
}

test_admin_users_list() {
  log_info "Testing GET /api/v1/admin/users"

  local response
  response="$(http_get "/v1/admin/users?page=1&pageSize=5")"
  parse_response "$response"

  if ! assert_status "200" "$HTTP_STATUS" "List admin users"; then
    return 1
  fi
  assert_json_field "$HTTP_BODY" "data" "Users list contains data"
}

test_admin_users_bulk_create() {
  log_info "Testing POST /api/v1/admin/users (bulk create)"

  local suffix timestamp username email password payload
  timestamp="$(date +%s)"
  suffix="${timestamp}${RANDOM}"
  username="auto-student-$suffix"
  email="auto-student-$suffix@example.com"
  password="Student#${suffix}"

  read -r -d '' payload <<EOF
{
  "users": [
    {
      "username": "$username",
      "email": "$email",
      "password": "$password",
      "role": "STUDENT",
      "status": "ACTIVE",
      "studentProfile": {
        "studentNo": "S$suffix",
        "grade": "2025",
        "major": "Computer Science",
        "className": "CS-$suffix"
      }
    }
  ]
}
EOF

  local response
  response="$(http_post "/v1/admin/users" "$payload")"
  parse_response "$response"

  if ! assert_status "201" "$HTTP_STATUS" "Bulk create student user"; then
    return 1
  fi

  if ! assert_json_field "$HTTP_BODY" "data.created" "Bulk create response has created list"; then
    return 1
  fi

  local created_id
  created_id="$(echo "$HTTP_BODY" | jq -r '.data.created[0].id // empty')"
  if [[ -z "$created_id" ]]; then
    log_error "Failed to extract created user id"
    return 1
  fi

  ADMIN_USERS_LAST_ID="$created_id"
  ADMIN_USERS_LAST_USERNAME="$username"
  ADMIN_USERS_LAST_PASSWORD="$password"

  log_success "Created student user $username ($created_id)"
  return 0
}

test_admin_users_update_status() {
  if [[ -z "$ADMIN_USERS_LAST_ID" ]]; then
    log_warn "Skipping update status test (no user id)"
    return 0
  fi

  log_info "Testing PUT /api/v1/admin/users/${ADMIN_USERS_LAST_ID}/status"

  local payload
  payload='{"status":"DISABLED","reason":"Automated regression test disable"}'

  local response
  response="$(http_put "/v1/admin/users/${ADMIN_USERS_LAST_ID}/status" "$payload")"
  parse_response "$response"

  if ! assert_status "200" "$HTTP_STATUS" "Update user status"; then
    return 1
  fi

  if ! assert_json_field "$HTTP_BODY" "data.status" "Status update response has status field"; then
    return 1
  fi

  admin_users_assert_json_equals "$HTTP_BODY" "data.status" "DISABLED" "User status updated to DISABLED"
}

run_admin_users_tests() {
  printf '\n==================================\n'
  printf 'Admin User Management Tests\n'
  printf '==================================\n'

  if ! admin_users_login_as "$ADMIN_USERNAME" "$ADMIN_PASSWORD"; then
    log_error "Admin login failed, skipping admin user tests"
    printf '\n'
    return 1
  fi

  test_admin_users_list
  test_admin_users_bulk_create
  test_admin_users_update_status

  printf '\n'
}


