#!/usr/bin/env bash
# Course modules and resources API tests (Bash)

if ! declare -F log_info >/dev/null 2>&1; then
  # shellcheck source=/dev/null
  source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
fi

COURSE_CONTENT_TEACHER_USERNAME=""
COURSE_CONTENT_TEACHER_PASSWORD=""
COURSE_CONTENT_COURSE_ID=""
COURSE_CONTENT_MODULE_ID=""

course_content_login() {
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

course_content_create_teacher() {
  log_info "Creating temporary teacher via POST /api/v1/admin/users"

  local suffix username email password payload response
  suffix="$(date +%s)$RANDOM"
  username="auto-teacher-$suffix"
  email="auto-teacher-$suffix@example.com"
  password="Teacher#${suffix}"

  read -r -d '' payload <<EOF
{
  "users": [
    {
      "username": "$username",
      "email": "$email",
      "password": "$password",
      "role": "TEACHER",
      "status": "ACTIVE",
      "teacherProfile": {
        "teacherNo": "T$suffix",
        "department": "Mathematics",
        "title": "Lecturer",
        "subjects": ["Linear Algebra", "Discrete Math"]
      }
    }
  ]
}
EOF

  response="$(http_post "/admin/users" "$payload")"
  parse_response "$response"

  if ! assert_status "201" "$HTTP_STATUS" "Create temporary teacher"; then
    return 1
  fi

  COURSE_CONTENT_TEACHER_USERNAME="$username"
  COURSE_CONTENT_TEACHER_PASSWORD="$password"

  log_success "Created teacher $username"
  return 0
}

course_content_create_course() {
  log_info "Testing POST /api/v1/courses as teacher"

  local payload response course_id
  local suffix
  suffix="$(date +%s)$RANDOM"

  read -r -d '' payload <<EOF
{
  "name": "Automated Course $suffix",
  "semester": "2025春",
  "credit": 3,
  "enrollLimit": 50
}
EOF

  response="$(http_post "/courses" "$payload")"
  parse_response "$response"

  if ! assert_status "201" "$HTTP_STATUS" "Create course"; then
    return 1
  fi

  if ! assert_json_field "$HTTP_BODY" "data.id" "Course creation response has id"; then
    return 1
  fi

  course_id="$(echo "$HTTP_BODY" | jq -r '.data.id // empty')"
  if [[ -z "$course_id" ]]; then
    log_error "Failed to extract course id"
    return 1
  fi

  COURSE_CONTENT_COURSE_ID="$course_id"
  log_success "Created course $course_id"
  return 0
}

course_content_create_module() {
  if [[ -z "$COURSE_CONTENT_COURSE_ID" ]]; then
    log_warn "Skipping module creation (no course id)"
    return 0
  fi

  log_info "Testing POST /api/v1/courses/${COURSE_CONTENT_COURSE_ID}/modules"
  local payload response module_id

  read -r -d '' payload <<EOF
{
  "title": "第 1 周 · 自动化测试章节",
  "displayOrder": 1,
  "releaseAt": "2025-09-01T00:00:00Z"
}
EOF

  response="$(http_post "/courses/${COURSE_CONTENT_COURSE_ID}/modules" "$payload")"
  parse_response "$response"

  if ! assert_status "200" "$HTTP_STATUS" "Create course module"; then
    return 1
  fi

  if ! assert_json_field "$HTTP_BODY" "data.id" "Module creation response has id"; then
    return 1
  fi

  module_id="$(echo "$HTTP_BODY" | jq -r '.data.id // empty')"
  COURSE_CONTENT_MODULE_ID="$module_id"
  log_success "Created module $module_id"
  return 0
}

course_content_get_modules() {
  if [[ -z "$COURSE_CONTENT_COURSE_ID" ]]; then
    log_warn "Skipping GET modules test (no course id)"
    return 0
  fi

  log_info "Testing GET /api/v1/courses/${COURSE_CONTENT_COURSE_ID}/modules"

  local response
  response="$(http_get "/courses/${COURSE_CONTENT_COURSE_ID}/modules")"
  parse_response "$response"

  if ! assert_status "200" "$HTTP_STATUS" "List course modules"; then
    return 1
  fi

  if ! assert_json_field "$HTTP_BODY" "data" "Modules list has data"; then
    return 1
  fi

  if [[ -n "$COURSE_CONTENT_MODULE_ID" ]]; then
    local module_title
    module_title="$(echo "$HTTP_BODY" | jq -r --arg id "$COURSE_CONTENT_MODULE_ID" '.data[] | select(.id == $id) | .title // empty')"
    if [[ -n "$module_title" ]]; then
      log_success "Modules list contains created module ($module_title)"
    else
      log_warn "Created module not found in list response"
    fi
  fi
}

run_course_content_tests() {
  printf '\n==================================\n'
  printf 'Course Content Tests\n'
  printf '==================================\n'

  if ! course_content_login "$ADMIN_USERNAME" "$ADMIN_PASSWORD"; then
    log_error "Admin login failed, skipping course content tests"
    printf '\n'
    return 1
  fi

  if ! course_content_create_teacher; then
    printf '\n'
    return 1
  fi

  if ! course_content_login "$COURSE_CONTENT_TEACHER_USERNAME" "$COURSE_CONTENT_TEACHER_PASSWORD"; then
    log_error "Teacher login failed, skipping course content tests"
    printf '\n'
    return 1
  fi

  course_content_create_course
  course_content_create_module
  course_content_get_modules

  # Restore admin token for subsequent tests
  course_content_login "$ADMIN_USERNAME" "$ADMIN_PASSWORD" >/dev/null 2>&1

  printf '\n'
}


