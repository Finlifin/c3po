#!/usr/bin/env fish
# 管理员用户管理相关测试

if not functions -q log_info
    source (dirname (status --current-filename))/lib.fish
end

set -gx ADMIN_USERS_LAST_ID ""
set -gx ADMIN_USERS_LAST_USERNAME ""
set -gx ADMIN_USERS_LAST_PASSWORD ""

function admin_users_login_as
    set -l username $argv[1]
    set -l password $argv[2]

    set -l payload (printf '{"identifier":"%s","password":"%s"}' $username $password)
    set -l response (http_post "/auth/login" $payload)
    set -l parsed (parse_response $response)

    set -l body $parsed[1]
    set -l http_code $parsed[2]

    if not assert_status "200" "$http_code" "Login as $username"
        return 1
    end

    if not assert_json_field "$body" "accessToken" "Login response has accessToken"
        return 1
    end

    save_token "$body" >/dev/null
    return 0
end

function admin_users_assert_json_equals
    set -l json $argv[1]
    set -l field $argv[2]
    set -l expected $argv[3]
    set -l message $argv[4]

    set -l actual (echo $json | jq -r --arg field "$field" 'try (reduce ($field | split(".")) as $seg (.; .[$seg])) // empty')
    if test "$actual" = "$expected"
        log_success "$message ('$actual')"
        return 0
    else
        if test -z "$actual"
            set actual "<empty>"
        end
        log_error "$message (expected '$expected', got '$actual')"
        return 1
    end
end

function test_admin_users_list
    log_info "Testing GET /api/v1/admin/users"

    set -l response (http_get "/admin/users?page=1&pageSize=5")
    set -l parsed (parse_response $response)
    set -l body $parsed[1]
    set -l http_code $parsed[2]

    if not assert_status "200" "$http_code" "List admin users"
        return 1
    end

    assert_json_field "$body" "data" "Users list contains data"
end

function test_admin_users_bulk_create
    log_info "Testing POST /api/v1/admin/users (bulk create)"

    set -l suffix (string join "" (date +%s) (random))
    set -l username "auto-student-$suffix"
    set -l email "auto-student-$suffix@example.com"
    set -l password "Student#$suffix"

    set -l payload (printf '{
  "users": [
    {
      "username": "%s",
      "email": "%s",
      "password": "%s",
      "role": "STUDENT",
      "status": "ACTIVE",
      "studentProfile": {
        "studentNo": "S%s",
        "grade": "2025",
        "major": "Computer Science",
        "className": "CS-%s"
      }
    }
  ]
}' $username $email $password $suffix $suffix)

    set -l response (http_post "/admin/users" $payload)
    set -l parsed (parse_response $response)
    set -l body $parsed[1]
    set -l http_code $parsed[2]

    if not assert_status "201" "$http_code" "Bulk create student user"
        return 1
    end

    if not assert_json_field "$body" "data.created" "Bulk create response has created list"
        return 1
    end

    set -l created_id (echo $body | jq -r '.data.created[0].id // empty')
    if test -z "$created_id"
        log_error "Failed to extract created user id"
        return 1
    end

    set -gx ADMIN_USERS_LAST_ID $created_id
    set -gx ADMIN_USERS_LAST_USERNAME $username
    set -gx ADMIN_USERS_LAST_PASSWORD $password

    log_success "Created student user $username ($created_id)"
end

function test_admin_users_update_status
    if test -z "$ADMIN_USERS_LAST_ID"
        log_warn "Skipping update status test (no user id)"
        return 0
    end

    log_info "Testing PUT /api/v1/admin/users/$ADMIN_USERS_LAST_ID/status"

    set -l payload '{"status":"DISABLED","reason":"Automated regression test disable"}'
    set -l response (http_put "/admin/users/$ADMIN_USERS_LAST_ID/status" $payload)
    set -l parsed (parse_response $response)
    set -l body $parsed[1]
    set -l http_code $parsed[2]

    if not assert_status "200" "$http_code" "Update user status"
        return 1
    end

    if not assert_json_field "$body" "data.status" "Status update response has status field"
        return 1
    end

    admin_users_assert_json_equals "$body" "data.status" "DISABLED" "User status updated to DISABLED"
end

function run_admin_users_tests
    echo ""
    echo "=================================="
    echo "Admin User Management Tests"
    echo "=================================="

    if not admin_users_login_as $ADMIN_USERNAME $ADMIN_PASSWORD
        log_error "Admin login failed, skipping admin user tests"
        echo ""
        return 1
    end

    test_admin_users_list
    test_admin_users_bulk_create
    test_admin_users_update_status

    echo ""
end


