#!/usr/bin/env fish
# Members API测试

source (dirname (status --current-filename))/lib.fish

set -g CREATED_MEMBER_ID ""

function test_members_create
    log_info "Testing POST /api/members"
    
    set -l timestamp (date +%s)
    set -l payload (printf '{"name":"Test Member %s","studentId":"S%s","major":"Computer Science","joinDate":"2024-01-01","status":"active","role":"member","email":"test%s@example.com","phone":"1234567890"}' $timestamp $timestamp $timestamp)
    
    set -l response (http_post "/members" $payload)
    set -l parsed (parse_response $response)
    
    set -l body $parsed[1]
    set -l http_code $parsed[2]
    
    log_info "Response body: $body"
    log_info "Response status: $http_code"
    
    if not assert_status "200" "$http_code" "Create member request"
        return 1
    end
    
    if not assert_json_field "$body" "id" "Member response has id"
        return 1
    end
    
    set -g CREATED_MEMBER_ID (echo $body | jq -r '.id')
    log_info "Created member ID: $CREATED_MEMBER_ID"
    
    return 0
end

function test_members_list
    log_info "Testing GET /api/members"
    
    set -l response (http_get "/members?page=1&limit=20")
    set -l parsed (parse_response $response)
    
    set -l body $parsed[1]
    set -l http_code $parsed[2]
    
    log_info "Response status: $http_code"
    
    if not assert_status "200" "$http_code" "List members request"
        return 1
    end
    
    if not assert_json_field "$body" "items" "Members response has items"
        return 1
    end
    
    return 0
end

function test_members_get
    if test -z "$CREATED_MEMBER_ID"
        log_warn "Skipping GET member test (no member created)"
        return 0
    end
    
    log_info "Testing GET /api/members/$CREATED_MEMBER_ID"
    
    set -l response (http_get "/members/$CREATED_MEMBER_ID")
    set -l parsed (parse_response $response)
    
    set -l body $parsed[1]
    set -l http_code $parsed[2]
    
    log_info "Response status: $http_code"
    
    if not assert_status "200" "$http_code" "Get member request"
        return 1
    end
    
    if not assert_json_field "$body" "id" "Member has id"
        return 1
    end
    
    return 0
end

function test_members_delete
    if test -z "$CREATED_MEMBER_ID"
        log_warn "Skipping DELETE member test (no member created)"
        return 0
    end
    
    log_info "Testing DELETE /api/members/$CREATED_MEMBER_ID"
    
    set -l response (http_delete "/members/$CREATED_MEMBER_ID")
    set -l parsed (parse_response $response)
    
    set -l http_code $parsed[2]
    
    log_info "Response status: $http_code"
    
    # 204 No Content or 200 OK
    if test "$http_code" = "204"; or test "$http_code" = "200"
        log_success "Delete member request (HTTP $http_code)"
        return 0
    else
        log_error "Delete member request (Expected HTTP 204 or 200, got $http_code)"
        return 1
    end
end

function run_members_tests
    echo ""
    echo "=================================="
    echo "Members Tests"
    echo "=================================="
    
    test_members_create
    test_members_list
    test_members_get
    test_members_delete
    
    echo ""
end

