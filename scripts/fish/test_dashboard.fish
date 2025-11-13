#!/usr/bin/env fish
# Dashboard API测试

source (dirname (status --current-filename))/lib.fish

function test_dashboard_overview
    log_info "Testing GET /api/v1/dashboard/overview"
    
    set -l response (http_get "/dashboard/overview")
    set -l parsed (parse_response $response)
    
    set -l body $parsed[1]
    set -l http_code $parsed[2]
    
    log_info "Response body: $body"
    log_info "Response status: $http_code"
    
    if not assert_status "200" "$http_code" "Dashboard overview request"
        return 1
    end
    
    if not assert_json_field "$body" "totalMembers" "Dashboard has totalMembers"
        return 1
    end
    
    if not assert_json_field "$body" "activeMembers" "Dashboard has activeMembers"
        return 1
    end
    
    if not assert_json_field "$body" "totalActivities" "Dashboard has totalActivities"
        return 1
    end
    
    return 0
end

function run_dashboard_tests
    echo ""
    echo "=================================="
    echo "Dashboard Tests"
    echo "=================================="
    
    test_dashboard_overview
    
    echo ""
end

