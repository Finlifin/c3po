#!/usr/bin/env fish
# 认证相关API测试

source (dirname (status --current-filename))/lib.fish

function test_auth_login
    log_info "Testing POST /api/v1/auth/login"
    
    set -l payload (printf '{"identifier":"%s","password":"%s"}' $ADMIN_USERNAME $ADMIN_PASSWORD)
    set -l response (http_post "/auth/login" $payload)
    set -l parsed (parse_response $response)
    
    set -l body $parsed[1]
    set -l http_code $parsed[2]
    
    log_info "Request: POST $API_BASE_URL/auth/login"
    log_info "Payload: $payload"
    log_info "Response body: $body"
    log_info "Response status: $http_code"
    
    if not assert_status "200" "$http_code" "Login request"
        return 1
    end
    
    if not assert_json_field "$body" "accessToken" "Login response has accessToken"
        return 1
    end
    
    if not assert_json_field "$body" "tokenType" "Login response has tokenType"
        return 1
    end
    
    save_token "$body"
    return 0
end

function test_auth_me
    log_info "Testing GET /api/v1/auth/me"
    
    set -l response (http_get "/auth/me")
    set -l parsed (parse_response $response)
    
    set -l body $parsed[1]
    set -l http_code $parsed[2]
    
    log_info "Response body: $body"
    log_info "Response status: $http_code"
    
    if not assert_status "200" "$http_code" "Get profile request"
        return 1
    end
    
    if not assert_json_field "$body" "username" "Profile has username"
        return 1
    end
    
    if not assert_json_field "$body" "role" "Profile has role"
        return 1
    end
    
    return 0
end

function test_auth_invalid_credentials
    log_info "Testing login with invalid credentials"
    
    set -l payload '{"identifier":"admin","password":"wrongpassword"}'
    set -l response (http_post "/auth/login" $payload)
    set -l parsed (parse_response $response)
    
    set -l http_code $parsed[2]
    
    log_info "Response status: $http_code"
    
    assert_status "401" "$http_code" "Invalid credentials should return 401"
    return 0
end

function run_auth_tests
    echo ""
    echo "=================================="
    echo "Authentication Tests"
    echo "=================================="
    
    clear_token
    
    test_auth_login
    test_auth_me
    test_auth_invalid_credentials
    
    echo ""
end

